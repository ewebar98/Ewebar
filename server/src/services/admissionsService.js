import mongoose from "mongoose";
import { Application } from "../models/applicationModel.js";
import { Program } from "../models/universityModel.js";
import Notification from "../models/notificationModel.js";
import Message from "../models/messageModel.js";

// Run batch admissions for a single program: create reserved offers for top-match pending applicants up to available slots
export async function runBatchAdmissionsForProgram(programId, performedBy = "system") {
  const session = await mongoose.startSession();
  let admittedCount = 0;

  try {
    await session.withTransaction(async () => {
      const program = await Program.findById(programId).session(session).populate("institutionId", "name");
      if (!program) throw new Error("program_not_found");

      const available = Math.max(0, (program.totalCapacity || 0) - (program.currentAdmitted || 0));
      if (available === 0) {
        return;
      }

      const pendingApps = await Application.find({ courseId: program._id, status: "pending" })
        .sort({ matchScore: -1, createdAt: 1 })
        .limit(available)
        .session(session)
        .populate("studentId", "fullName email");

      if (!pendingApps || pendingApps.length === 0) return;

      const OFFER_HOURS = program.autoAdmission?.offerExpiryHours || 72;

      for (const app of pendingApps) {
        app.status = "offered";
        app.offerExpiresAt = new Date(Date.now() + OFFER_HOURS * 60 * 60 * 1000);
        app.auditTrail.push({ action: `Batch offered to ${program.name}`, performedBy });
        await app.save({ session });

        await Notification.create([
          {
            userId: app.studentId._id,
            title: "Admission Offer",
            body: `You have been offered admission to ${program.name} at ${program.institutionId?.name || "your chosen institution"}. Please confirm within ${OFFER_HOURS} hours.",
            type: "success",
            link: "/applications",
          },
        ], { session });

        await Message.create([
          {
            applicationId: app._id,
            senderId: null,
            senderRole: "system",
            message: `System: You have been offered admission to ${program.name}. Please confirm within ${OFFER_HOURS} hours.",
            read: false,
          },
        ], { session });

        admittedCount++;
      }

      program.currentAdmitted = (program.currentAdmitted || 0) + admittedCount;
      await program.save({ session });
    });

    await session.endSession();
    return { admitted: admittedCount };
  } catch (err) {
    await session.endSession();
    // Fallback non-transactional reservation if transactions are unavailable (single-node / no-replica-set)
    try {
      const program = await Program.findById(programId).populate("institutionId", "name");
      if (!program) return { admitted: 0, reason: "program_not_found" };

      const available = Math.max(0, (program.totalCapacity || 0) - (program.currentAdmitted || 0));
      if (available === 0) return { admitted: 0, reason: "no_slots" };

      const pendingApps = await Application.find({ courseId: program._id, status: "pending" })
        .sort({ matchScore: -1, createdAt: 1 })
        .limit(available)
        .populate("studentId", "fullName email");

      let count = 0;
      const OFFER_HOURS = program.autoAdmission?.offerExpiryHours || 72;
      for (const app of pendingApps) {
        // Attempt to reserve by incrementing program atomically
        const updated = await Program.findOneAndUpdate(
          { _id: program._id, $expr: { $lt: ["$currentAdmitted", "$totalCapacity"] } },
          { $inc: { currentAdmitted: 1 } },
          { new: true }
        );
        if (!updated) break; // no more slots

        app.status = "offered";
        app.offerExpiresAt = new Date(Date.now() + OFFER_HOURS * 60 * 60 * 1000);
        app.auditTrail.push({ action: `Batch offered to ${program.name}`, performedBy });
        await app.save();

        await Notification.create({
          userId: app.studentId._id,
          title: "Admission Offer",
          body: `You have been offered admission to ${program.name} at ${program.institutionId?.name || "your chosen institution"}. Please confirm within ${OFFER_HOURS} hours.",
          type: "success",
          link: "/applications",
        });

        await Message.create({
          applicationId: app._id,
          senderId: null,
          senderRole: "system",
          message: `System: You have been offered admission to ${program.name}. Please confirm within ${OFFER_HOURS} hours.",
          read: false,
        });

        count++;
      }

      return { admitted: count };
    } catch (err2) {
      console.error("Batch admissions error:", err2);
      return { admitted: 0, reason: "error" };
    }
  }
}

// Run batch admissions for all programs configured for batch mode
export async function runBatchAdmissionsForAll() {
  const programs = await Program.find({
    "autoAdmission.enabled": true,
    "autoAdmission.mode": "batch",
    $expr: { $lt: ["$currentAdmitted", "$totalCapacity"] },
  });

  let totalAdmitted = 0;
  for (const p of programs) {
    const res = await runBatchAdmissionsForProgram(p._id, "system-scheduler");
    totalAdmitted += res.admitted || 0;
  }

  return { totalAdmitted, programsProcessed: programs.length };

}

// Expire stale offers and release reserved slots
export async function expireStaleOffers() {
  const now = new Date();
  const staleOffers = await Application.find({ status: "offered", offerExpiresAt: { $lt: now } }).populate("courseId").populate("studentId", "fullName");
  let released = 0;
  for (const app of staleOffers) {
    app.status = "expired";
    app.auditTrail.push({ action: `Offer expired for ${app.courseId?.name}`, performedBy: "system" });
    await app.save();

    // Release reserved slot
    await Program.findByIdAndUpdate(app.courseId._id, { $inc: { currentAdmitted: -1 } });

    await Notification.create({
      userId: app.studentId._id,
      title: "Offer Expired",
      body: `Your offer for ${app.courseId?.name} has expired.`,
      type: "error",
      link: "/applications",
    });

    released++;
  }
  return { released };
}

export default { runBatchAdmissionsForProgram, runBatchAdmissionsForAll, expireStaleOffers };
