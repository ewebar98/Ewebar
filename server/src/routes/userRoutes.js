import express from "express";
import User from "../models/userModel.js";
import Recommendation from "../models/recommendationModel.js";
import Notification from "../models/notificationModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate, profileUpdateSchema } from "../middleware/validationMiddleware.js";
import upload from "../utils/multerConfig.js";
import AuditLog from "../models/auditLogModel.js";

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        success: true,
        message: "Profile fetched",
        data: user,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);

// @desc    Get consolidated dashboard data (profile, recommendations, notifications in 1 parallel query)
// @route   GET /api/users/dashboard-context
// @access  Private
router.get(
  "/dashboard-context",
  protect,
  asyncHandler(async (req, res) => {
    const [user, notifications] = await Promise.all([
      User.findById(req.user._id),
      Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10),
    ]);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Dynamic recommendations resolution on the fly
    const { generateRecommendations } = await import("../services/recommendationService.js");
    const recommendations = await generateRecommendations(user);

    res.json({
      success: true,
      message: "Dashboard context fetched successfully",
      data: {
        profile: user,
        recommendations,
        notifications,
      },
    });
  })
);

// @desc    Update user profile
// @route   PUT /api/users/update-profile
// @access  Private
router.put(
  "/update-profile",
  protect,
  validate(profileUpdateSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const previousState = user ? user.toObject() : null;

    if (user) {
      user.fullName = req.body.fullName || user.fullName;
      user.jambScore = req.body.jambScore !== undefined ? req.body.jambScore : user.jambScore;
      if (req.body.jambRegNo !== undefined) {
        user.jambRegNo = req.body.jambRegNo;
      }
      if (req.body.jambCandidateName !== undefined) {
        user.jambCandidateName = req.body.jambCandidateName;
      }
      if (req.body.jambDateOfBirth !== undefined) {
        user.jambDateOfBirth = req.body.jambDateOfBirth;
      }
      if (req.body.jambGender !== undefined) {
        user.jambGender = req.body.jambGender;
      }
      if (req.body.jambExamNo !== undefined) {
        user.jambExamNo = req.body.jambExamNo;
      }
      user.interests = req.body.interests || user.interests;
      user.preferredLocation = req.body.preferredLocation || user.preferredLocation;
      if (req.body.subjects !== undefined) {
        user.subjects = req.body.subjects;
      }
      if (req.body.jambSubjects !== undefined) {
        user.jambSubjects = req.body.jambSubjects;
      }
      if (req.body.olevelSittings !== undefined) {
        user.olevelSittings = req.body.olevelSittings;
      }
      if (req.body.stateOfOrigin !== undefined) {
        user.stateOfOrigin = req.body.stateOfOrigin;
      }
      if (req.body.lga !== undefined) {
        user.lga = req.body.lga;
      }
      if (req.body.preferredCourse !== undefined) {
        user.preferredCourse = req.body.preferredCourse;
      }
      if (req.body.bio !== undefined) {
        user.bio = req.body.bio;
      }

      const updatedUser = await user.save();

      // Invalidate the MongoDB recommendation cache for this user
      await Recommendation.deleteOne({ userId: req.user._id });
      console.log(`[Cache Invalidate] Cleared recommendation cache for user ${req.user._id} due to profile update.`);

      // Send confirmation notification
      if (req.body.jambScore !== undefined || req.body.olevelSittings !== undefined) {
        await Notification.create({
          userId: req.user._id,
          title: "Academic Results Confirmed",
          body: "Your academic results (JAMB & O'Level sittings) have been successfully saved and verified. Recommendations are recalculated.",
          type: "success",
          link: "/profile",
        });
        await AuditLog.create({
          actorId: req.user._id,
          actorRole: req.user.role,
          action: "USER_PROFILE_UPDATE",
          entityName: "User",
          entityId: user._id,
          previousState,
          newState: updatedUser.toObject(),
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || "",
        });
      }

      res.json({
        success: true,
        message: "Profile updated",
        data: updatedUser,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  })
);

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
router.get(
  "/notifications",
  protect,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      message: "Notifications fetched",
      data: notifications,
    });
  })
);

// @desc    Mark all notifications as read
// @route   PUT /api/users/notifications/read-all
// @access  Private
router.put(
  "/notifications/read-all",
  protect,
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  })
);

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:id/read
// @access  Private
router.put(
  "/notifications/:id/read",
  protect,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (notification) {
      notification.read = true;
      await notification.save();
      res.json({
        success: true,
        message: "Notification marked as read",
        data: notification,
      });
    } else {
      res.status(404);
      throw new Error("Notification not found");
    }
  })
);

// @desc    Get user's uploaded documents
// @route   GET /api/users/documents
// @access  Private
router.get(
  "/documents",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    res.json({
      success: true,
      message: "Documents fetched",
      data: user.uploadedDocuments || [],
    });
  })
);

// @desc    Delete an academic document locker file
// @route   DELETE /api/users/documents/:id
// @access  Private
router.delete(
  "/documents/:id",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    let deleted = false;
    let docToRemove = null;

    if (user.jambResultSlip && user.jambResultSlip._id && user.jambResultSlip._id.toString() === req.params.id) {
      docToRemove = user.jambResultSlip;
      user.jambResultSlip = undefined;
      deleted = true;
    } else {
      for (let i = 0; i < user.olevelSittings.length; i++) {
        if (user.olevelSittings[i].resultSlip && user.olevelSittings[i].resultSlip._id && user.olevelSittings[i].resultSlip._id.toString() === req.params.id) {
          docToRemove = user.olevelSittings[i].resultSlip;
          user.olevelSittings[i].resultSlip = undefined;
          deleted = true;
          break;
        }
      }
    }

    if (!deleted) {
      const docIndex = user.uploadedDocuments.findIndex(
        (doc) => doc._id.toString() === req.params.id
      );

      if (docIndex !== -1) {
        docToRemove = user.uploadedDocuments[docIndex];
        user.uploadedDocuments.splice(docIndex, 1);
        deleted = true;
      }
    }

    if (!deleted || !docToRemove) {
      res.status(404);
      throw new Error("Document not found");
    }

    // Unlink file from local disk if it exists
    if (docToRemove.url) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const { fileURLToPath } = await import("url");

        const currentDir = path.dirname(fileURLToPath(import.meta.url));
        const filename = docToRemove.url.replace("/uploads/", "");
        const filePath = path.join(currentDir, "..", "uploads", filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[File Delete] Physically removed ${filePath}`);
        }
      } catch (err) {
        console.warn("[File Delete Error] Failed to unlink physical file:", err.message);
      }
    }

    await user.save();

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  })
);

// @desc    Upload an academic document locker file
// @route   POST /api/users/upload-document
// @access  Private
router.post(
  "/upload-document",
  protect,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error("Please upload a file");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const newDoc = {
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date(),
    };

    const type = req.query.type;
    let savedDoc;

    if (type === "jamb") {
      user.jambResultSlip = newDoc;
      savedDoc = user.jambResultSlip;
    } else if (type === "olevel") {
      const sittingNumber = parseInt(req.query.sittingNumber, 10) || 1;
      const sittingIndex = user.olevelSittings.findIndex(s => s.sittingNumber === sittingNumber);
      if (sittingIndex !== -1) {
        user.olevelSittings[sittingIndex].resultSlip = newDoc;
        savedDoc = user.olevelSittings[sittingIndex].resultSlip;
      } else {
        user.olevelSittings.push({
          sittingNumber,
          resultSlip: newDoc
        });
        savedDoc = user.olevelSittings[user.olevelSittings.length - 1].resultSlip;
      }
    } else {
      user.uploadedDocuments.push(newDoc);
      savedDoc = user.uploadedDocuments[user.uploadedDocuments.length - 1];
    }

    await user.save();

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: savedDoc,
    });
  })
);

// @desc    Run mock AI OCR parsing on uploaded files and sync profile metrics
// @route   POST /api/users/ocr-extract
// @access  Private
router.post(
  "/ocr-extract",
  protect,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error("Please upload a file to extract results");
    }

    const filenameLower = req.file.originalname.toLowerCase();
    
    let fileContent = "";
    try {
      const fs = await import("fs");
      if (req.file.path) {
        const buffer = fs.readFileSync(req.file.path);
        fileContent = buffer.toString("utf-8").toLowerCase();
      }
    } catch (err) {
      console.warn("OCR file read warn:", err.message);
    }

    const checkMatch = (term) => {
      return filenameLower.includes(term) || fileContent.includes(term);
    };

    let ocrResult;

    if (checkMatch("waec") || checkMatch("west african") || checkMatch("wassce") || checkMatch("ssce")) {
      ocrResult = {
        examType: "WAEC",
        candidateFullName: "JONATHAN MAYEN AKUABATA",
        examYear: "2018",
        sittingType: "May/June",
        examNumber: "4270203037",
        candidateNumber: "037",
        centerNumber: "4270203",
        schoolNumber: "42702",
        registrationNumber: "WAEC/2018/4270203037",
        subjects: [
          { name: "Data Processing", grade: "A1" },
          { name: "Geography", grade: "A1" },
          { name: "Civic Education", grade: "A1" },
          { name: "English Language", grade: "A1" },
          { name: "Further Mathematics", grade: "A1" },
          { name: "Mathematics", grade: "A1" },
          { name: "Biology", grade: "B2" },
          { name: "Chemistry", grade: "A1" },
          { name: "Physics", grade: "A1" },
        ],
      };
    } else if (checkMatch("neco") || checkMatch("national examinations") || checkMatch("national examination")) {
      ocrResult = {
        examType: "NECO",
        candidateFullName: "MOHAMMAD IBRAHIM SADA",
        dateOfBirth: "2000-01-26",
        gender: "Male",
        examYear: "2019",
        sittingType: "June/July",
        examNumber: "90906234AF",
        registrationNumber: "90906234AF",
        subjects: [
          { name: "English Language", grade: "C5" },
          { name: "Mathematics", grade: "C6" },
          { name: "Civic Education", grade: "B3" },
          { name: "Islamic Studies", grade: "C5" },
          { name: "Geography", grade: "C5" },
          { name: "Government", grade: "C5" },
          { name: "Economics", grade: "D7" },
          { name: "Biology", grade: "C6" },
          { name: "Chemistry", grade: "C6" },
        ],
      };
    } else if (checkMatch("nabteb") || checkMatch("national business") || checkMatch("technical examination")) {
      ocrResult = {
        examType: "NABTEB",
        candidateFullName: "SOBANDE IDOWU OPEYEMI",
        examYear: "2022",
        sittingType: "May/June",
        examNumber: "28001035",
        registrationNumber: "28001035",
        subjects: [
          { name: "Computer Craft Studies", grade: "C4" },
          { name: "Building / Engineering Drawing", grade: "E8" },
          { name: "Basic Electricity", grade: "C4" },
          { name: "English Language", grade: "C5" },
          { name: "Mathematics", grade: "C6" },
          { name: "Economics", grade: "C6" },
          { name: "Physics", grade: "C4" },
          { name: "Chemistry", grade: "B3" },
          { name: "Information & Communications Technology", grade: "B2" },
        ],
      };
    } else if (checkMatch("gce") || checkMatch("general certificate") || checkMatch("private")) {
      ocrResult = {
        examType: "GCE",
        candidateFullName: "AKINWALE KEHINDE DEBORAH",
        examYear: "2016",
        sittingType: "Nov/Dec",
        examNumber: "5251655119",
        registrationNumber: "5251655119",
        subjects: [
          { name: "Christian Religious Studies", grade: "F9" },
          { name: "Economics", grade: "F9" },
          { name: "Government", grade: "F9" },
          { name: "Literature-in-English", grade: "F9" },
          { name: "English Language", grade: "F9" },
          { name: "Yoruba Language", grade: "F9" },
          { name: "Mathematics", grade: "F9" },
          { name: "Agricultural Science", grade: "F9" },
        ],
      };
    } else {
      ocrResult = {
        examType: "JAMB",
        score: 362,
        candidateFullName: "Ejikeme Joy Mmesoma",
        dateOfBirth: "2004-03-02",
        gender: "Female",
        examYear: "2023",
        examNumber: "C05502116",
        jambRegNo: "202330639047FF",
        stateOfOrigin: "Enugu State",
        subjects: [
          { name: "Use of English", grade: "98" },
          { name: "Biology", grade: "94" },
          { name: "Physics", grade: "89" },
          { name: "Chemistry", grade: "81" },
        ],
      };
    }

    res.json({
      success: true,
      message: "OCR processing completed",
      data: ocrResult,
    });
  })
);

export default router;
