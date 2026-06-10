import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "offered", "accepted", "rejected", "expired", "provisional"],
      default: "pending",
      index: true,
    },
    // When an offer is made, expiry timestamp for student to confirm acceptance
    offerExpiresAt: {
      type: Date,
    },
    // When student confirms acceptance
    acceptedAt: {
      type: Date,
    },
    matchScore: {
      type: Number,
      default: 85,
    },
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    auditTrail: [
      {
        action: {
          type: String,
          required: true,
        },
        performedBy: {
          type: String, // "student" or "admin" or email
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to automatically initialize audit trail on creation
applicationSchema.pre("save", function (next) {
  if (this.isNew && this.auditTrail.length === 0) {
    this.auditTrail.push({
      action: "Application Created & Submitted",
      performedBy: "student",
      notes: `Initial program application matching score is ${this.matchScore}%`,
    });
  }
  if (typeof next === "function") next();
});

export const Application = mongoose.model("Application", applicationSchema);
export default Application;
