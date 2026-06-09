import express from "express";
import {
  getUniversities,
  getUniversityById,
  getCourses,
  getCourseById,
  updateProgramCapacity,
} from "../controllers/universityController.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/universities", getUniversities);
router.get("/universities/:id", validateObjectId("id"), getUniversityById);
router.get("/courses", getCourses);
router.get("/courses/:id", validateObjectId("id"), getCourseById);
router.put("/programs/:id/capacity", protect, updateProgramCapacity);

export default router;
