import express from "express";
import {
  getScholarships,
  applyForCourse,
  getUserApplications,
  getApplicationMessages,
  sendApplicationMessage,
  markMessagesAsRead,
  evaluateApplication,
} from "../controllers/applicationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/scholarships", getScholarships);
router.get("/applications", protect, getUserApplications);
router.post("/applications/apply", protect, applyForCourse);

// Application real-time admissions support chat routes
router.get("/applications/:id/messages", protect, getApplicationMessages);
router.post("/applications/:id/messages", protect, sendApplicationMessage);
router.put("/applications/:id/messages/read", protect, markMessagesAsRead);
router.put("/applications/:id/evaluate", protect, evaluateApplication);

export default router;
