import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getScholarships,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  applyForScholarship,
  applyForCourse,
  getUserApplications,
  getApplicationMessages,
  sendApplicationMessage,
  markMessagesAsRead,
} from "../controllers/applicationController.js";

const router = express.Router();

// Application Routes
router.route("/apply").post(protect, applyForCourse);
router.route("/").get(protect, getUserApplications);

// Application Messages
router.route("/:id/messages").get(protect, getApplicationMessages).post(protect, sendApplicationMessage);
router.route("/:id/messages/read").put(protect, markMessagesAsRead);

// Scholarship Routes
router.route("/scholarships")
  .get(getScholarships)
  .post(protect, adminOnly, createScholarship);

router.route("/scholarships/:id")
  .put(protect, adminOnly, updateScholarship)
  .delete(protect, adminOnly, deleteScholarship);

router.post("/scholarships/:id/apply", protect, applyForScholarship);

export default router;
