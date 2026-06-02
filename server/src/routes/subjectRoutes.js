import express from "express";
import Subject from "../models/subjectModel.js";

const router = express.Router();

/**
 * @route   GET /api/subjects/search
 * @desc    Search and autocomplete subjects with filters and core-sorting
 * @access  Public (or Protected, depending on application settings)
 */
router.get("/search", async (req, res, next) => {
  try {
    const { q, category, examType, limit = 15 } = req.query;

    const dbQuery = {};

    // 1. Optimized Fuzzy & Autocomplete Text Querying
    if (q && q.trim()) {
      const cleanQ = q.trim();
      const escapedQ = cleanQ.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      
      dbQuery.$or = [
        { name: { $regex: escapedQ, $options: "i" } },
        { shortName: { $regex: escapedQ, $options: "i" } },
        { aliases: { $regex: escapedQ, $options: "i" } }
      ];
    }

    // 2. Exact Indexed Filtering
    if (category) {
      dbQuery.category = category.toLowerCase().trim();
    }

    if (examType) {
      // In MongoDB, querying an array field with a single string matches if the array contains it
      dbQuery.examTypes = examType.toUpperCase().trim();
    }

    // 3. High Performance Lean Query with Selective Projection
    const subjects = await Subject.find(dbQuery)
      .select("name slug shortName category examTypes aliases isCoreSubject language code")
      .sort({ isCoreSubject: -1, name: 1 }) // Core subjects (Math/Eng) always float to the top
      .limit(Math.min(parseInt(limit), 50)) // Prevent excessive payload sizes
      .lean();

    return res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/subjects/categories
 * @desc    Get all distinct subject categories
 * @access  Public
 */
router.get("/categories", async (req, res, next) => {
  try {
    // Database distinct queries are highly optimized via secondary index scanning
    const categories = await Subject.distinct("category");
    
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
