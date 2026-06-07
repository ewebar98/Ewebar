import express from "express";
import User from "../models/userModel.js";
import Recommendation from "../models/recommendationModel.js";
import Notification from "../models/notificationModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate, profileUpdateSchema } from "../middleware/validationMiddleware.js";
import upload from "../utils/multerConfig.js";

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

    if (user) {
      user.fullName = req.body.fullName || user.fullName;
      user.jambScore = req.body.jambScore !== undefined ? req.body.jambScore : user.jambScore;
      user.interests = req.body.interests || user.interests;
      user.preferredLocation = req.body.preferredLocation || user.preferredLocation;
      if (req.body.waecAggregate !== undefined) {
        user.waecAggregate = req.body.waecAggregate;
      }
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
      if (req.body.jambScore !== undefined || req.body.waecAggregate !== undefined || req.body.olevelSittings !== undefined) {
        await Notification.create({
          userId: req.user._id,
          title: "Academic Results Confirmed",
          body: "Your academic results (JAMB & O'Level sittings) have been successfully saved and verified. Recommendations are recalculated.",
          type: "success",
          link: "/profile",
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

    const docIndex = user.uploadedDocuments.findIndex(
      (doc) => doc._id.toString() === req.params.id
    );

    if (docIndex === -1) {
      res.status(404);
      throw new Error("Document not found");
    }

    const doc = user.uploadedDocuments[docIndex];

    // Unlink file from local disk if it exists
    if (doc.url) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const { fileURLToPath } = await import("url");

        const currentDir = path.dirname(fileURLToPath(import.meta.url));
        const filename = doc.url.replace("/uploads/", "");
        const filePath = path.join(currentDir, "..", "uploads", filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[File Delete] Physically removed ${filePath}`);
        }
      } catch (err) {
        console.warn("[File Delete Error] Failed to unlink physical file:", err.message);
      }
    }

    // Pull document from MongoDB subdocument array
    user.uploadedDocuments.splice(docIndex, 1);
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

    user.uploadedDocuments.push(newDoc);
    await user.save();

    const savedDoc = user.uploadedDocuments[user.uploadedDocuments.length - 1];

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
        score: 8,
        candidateFullName: "JOHN DOE SSCE",
        dateOfBirth: "2008-04-12",
        gender: "Male",
        examYear: "2026",
        sittingType: "May/June",
        examNumber: "4201029012",
        candidateNumber: "012",
        centerNumber: "4201029",
        schoolNumber: "42010",
        registrationNumber: "WAEC/2026/4201029012",
        subjects: [
          { name: "Mathematics", grade: "A1" },
          { name: "English Language", grade: "B2" },
          { name: "Physics", grade: "A1" },
          { name: "Chemistry", grade: "B3" },
          { name: "Biology", grade: "B2" },
          { name: "Civic Education", grade: "A1" },
        ],
      };
    } else if (checkMatch("neco") || checkMatch("national examinations") || checkMatch("national examination")) {
      ocrResult = {
        examType: "NECO",
        score: 7,
        candidateFullName: "JOHN DOE NECO",
        dateOfBirth: "2008-04-12",
        gender: "Male",
        examYear: "2026",
        sittingType: "June/July",
        examNumber: "5291028104",
        candidateNumber: "104",
        centerNumber: "5291028",
        schoolNumber: "52910",
        registrationNumber: "NECO/2026/5291028104",
        subjects: [
          { name: "Mathematics", grade: "B3" },
          { name: "English Language", grade: "C4" },
          { name: "Physics", grade: "B2" },
          { name: "Chemistry", grade: "B3" },
          { name: "Biology", grade: "C5" },
          { name: "Civic Education", grade: "B3" },
        ],
      };
    } else if (checkMatch("nabteb") || checkMatch("national business") || checkMatch("technical examination")) {
      ocrResult = {
        examType: "NABTEB",
        score: 7,
        candidateFullName: "JOHN DOE NABTEB",
        dateOfBirth: "2008-04-12",
        gender: "Male",
        examYear: "2026",
        sittingType: "May/June",
        examNumber: "7401039401",
        candidateNumber: "401",
        centerNumber: "7401039",
        schoolNumber: "74010",
        registrationNumber: "NABTEB/2026/7401039401",
        subjects: [
          { name: "Mathematics", grade: "B2" },
          { name: "English Language", grade: "C5" },
          { name: "Physics", grade: "B3" },
          { name: "Chemistry", grade: "C4" },
          { name: "Biology", grade: "C5" },
        ],
      };
    } else if (checkMatch("gce") || checkMatch("general certificate")) {
      ocrResult = {
        examType: "GCE",
        score: 6,
        candidateFullName: "JOHN DOE GCE",
        dateOfBirth: "2008-04-12",
        gender: "Male",
        examYear: "2025",
        sittingType: "Nov/Dec",
        examNumber: "6302019230",
        candidateNumber: "230",
        centerNumber: "6302019",
        schoolNumber: "63020",
        registrationNumber: "GCE/2025/6302019230",
        subjects: [
          { name: "Mathematics", grade: "C4" },
          { name: "English Language", grade: "C6" },
          { name: "Physics", grade: "B3" },
          { name: "Chemistry", grade: "C4" },
          { name: "Geography", grade: "C5" },
        ],
      };
    } else {
      const randomScore = Math.floor(Math.random() * 40) + 260; // 260 - 300
      ocrResult = {
        examType: "JAMB",
        score: randomScore,
        subjects: [
          { name: "Use of English", grade: String(Math.floor(Math.random() * 15) + 65) },
          { name: "Mathematics", grade: String(Math.floor(Math.random() * 15) + 75) },
          { name: "Physics", grade: String(Math.floor(Math.random() * 15) + 70) },
          { name: "Chemistry", grade: String(Math.floor(Math.random() * 15) + 68) },
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
