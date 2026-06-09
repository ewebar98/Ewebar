import { generateRecommendations } from "../services/recommendationService.js";
import Recommendation from "../models/recommendationModel.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Get recommendations for the logged-in user (With optimized MongoDB Caching)
// @route   GET /api/recommendations
// @access  Private
export const getRecommendations = asyncHandler(async (req, res) => {
  const CACHE_AGE_LIMIT = 15 * 60 * 1000; // 15 minutes cache lifetime

  // 1. Check MongoDB Cache first
  const cachedRec = await Recommendation.findOne({ userId: req.user._id })
    .populate({
      path: "recommendedCourses.courseId",
      populate: { path: "institutionId" },
    });

  if (cachedRec) {
    const isStale = Date.now() - new Date(cachedRec.updatedAt).getTime() > CACHE_AGE_LIMIT;

    const jambScore = Number(req.user.jambScore) || 0;
    const hasInvalidCachedCourse = cachedRec.recommendedCourses.some((r) => {
      const cutoffMark = Number(r.courseId?.cutoffMark) || 200;
      return cutoffMark > jambScore || r.explanation?.startsWith("Ineligible");
    });

    if (!isStale && !hasInvalidCachedCourse) {
      console.log(`\x1b[36m[Cache Hit] Serving recommendations for user ${req.user._id} from MongoDB cache.\x1b[0m`);
      
      const data = cachedRec.recommendedCourses
        .filter((r) => {
          const cutoffMark = Number(r.courseId?.cutoffMark) || 200;
          return cutoffMark <= jambScore;
        })
        .map((r) => {
          const program = r.courseId;
          const institutionName = program?.institutionId?.name || "Unknown University";
          const institutionId = program?.institutionId?._id || "";
          return {
            _id: `${req.user._id}_${program?._id}`,
            universityId: { _id: institutionId, name: institutionName },
            courseId: {
              _id: program?._id,
              courseName: program?.name,
              cutoffMark: program?.cutoffMark || 200,
              slotsAvailable: 100,
            },
            matchScore: r.matchPercentage,
            reason: r.explanation,
          };
        });

      return res.json({
        success: true,
        message: "Recommendations fetched from cache",
        data,
      });
    }
  }

  // 2. Cache Miss or Stale Cache: Generate New Recommendations
  console.log(`\x1b[33m[Cache Miss] Generating fresh recommendations for user ${req.user._id}...\x1b[0m`);
  const rawRecs = await generateRecommendations(req.user);

  // 3. Save / Update in MongoDB Cache asynchronously (so next requests hit cache)
  await Recommendation.findOneAndUpdate(
    { userId: req.user._id },
    {
      recommendedCourses: rawRecs.map((r) => ({
        courseId: r.course._id,
        matchPercentage: r.matchPercentage,
        explanation: r.explanation,
      })),
      matchPercentage: rawRecs.length > 0 ? rawRecs[0].matchPercentage : 0,
    },
    { upsert: true, new: true }
  );

  // 4. Shape and return fresh recommendations
  const data = rawRecs.map((r) => ({
    _id: `${req.user._id}_${r.course._id}`,
    universityId: r.course.institutionId
      ? { _id: r.course.institutionId._id, name: r.course.institutionId.name }
      : { _id: "", name: "Unknown University" },
    courseId: {
      _id: r.course._id,
      courseName: r.course.name,
      cutoffMark: r.course.cutoffMark || 200,
      slotsAvailable: 100,
    },
    matchScore: r.matchPercentage,
    reason: r.explanation,
  }));

  res.json({
    success: true,
    message: "Recommendations generated successfully",
    data,
  });
});
