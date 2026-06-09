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
  confirmOfferAcceptance,
} from "../controllers/applicationController.js";

const router = express.Router();

// Application Routes
router.route("/applications/apply").post(protect, applyForCourse);
router.route("/applications").get(protect, getUserApplications);
router.post("/applications/:id/confirm-accept", protect, confirmOfferAcceptance);

// Application Messages
router.route("/applications/:id/messages").get(protect, getApplicationMessages).post(protect, sendApplicationMessage);
router.route("/applications/:id/messages/read").put(protect, markMessagesAsRead);

// Scholarship Routes
router.route("/scholarships")
  .get(getScholarships)
  .post(protect, adminOnly, createScholarship);

router.route("/scholarships/:id")
  .put(protect, adminOnly, updateScholarship)
  .delete(protect, adminOnly, deleteScholarship);

router.post("/scholarships/:id/apply", protect, applyForScholarship);

export default router;

