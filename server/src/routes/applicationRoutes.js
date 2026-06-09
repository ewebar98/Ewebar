import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getScholarships,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  applyForScholarship,
  applyForCourse,
  getUserApplications,
  getAdminApplications,
  getApplicationMessages,
  sendApplicationMessage,
  markMessagesAsRead,
  updateApplicationStatus,
} from "../controllers/applicationController.js";

const router = express.Router();

// Application Routes
router.route("/apply").post(protect, applyForCourse);
router.route("/").get(protect, getUserApplications);

// Admin Application Routes
router.route("/admin").get(protect, admin, getAdminApplications);
router.route("/admin/:id/status").put(protect, admin, updateApplicationStatus);

// Application Messages
router.route("/:id/messages").get(protect, getApplicationMessages).post(protect, sendApplicationMessage);
router.route("/:id/messages/read").put(protect, markMessagesAsRead);

// Scholarship Routes
router.route("/scholarships")
  .get(getScholarships)
  .post(protect, admin, createScholarship);

router.route("/scholarships/:id")
  .put(protect, admin, updateScholarship)
  .delete(protect, admin, deleteScholarship);

router.post("/scholarships/:id/apply", protect, applyForScholarship);

export default router;
