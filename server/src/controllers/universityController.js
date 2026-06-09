import { Institution, Program } from "../models/universityModel.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Get all institutions / universities with text search & metadata filters
// @route   GET /api/universities
// @access  Public
export const getUniversities = asyncHandler(async (req, res) => {
  const { search, state, ownershipType, institutionType, limit, page } = req.query;

  const query = {};
  const projection = {};
  let sort = { ranking: 1 }; // Default sort by ranking

  // 1. Scalable Text Search relevance scoring (Indexed fuzzy typo-tolerance)
  if (search && search.trim() !== "") {
    query.$text = { $search: search.trim() };
    projection.score = { $meta: "textScore" };
    sort = { score: { $meta: "textScore" } };
  }

  // 2. Strict Category Filtering
  if (state && state.trim() !== "") {
    query.state = { $regex: new RegExp(`^${state.trim()}$`, "i") }; // Case-insensitive matching
  }
  if (ownershipType && ["federal", "state", "private"].includes(ownershipType.toLowerCase())) {
    query.ownershipType = ownershipType.toLowerCase();
  }
  if (institutionType && ["university", "polytechnic", "college_of_education"].includes(institutionType.toLowerCase())) {
    query.institutionType = institutionType.toLowerCase();
  }

  // 3. Dynamic Pagination
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 500);
  const skip = (pageNum - 1) * limitNum;

  const institutions = await Institution.find(query, projection)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Institution.countDocuments(query);

  res.json({
    success: true,
    message: "Institutions fetched successfully",
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
    data: institutions,
  });
});

// @desc    Get institution by ID with its associated programs embedded
// @route   GET /api/universities/:id
// @access  Public
export const getUniversityById = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.params.id);

  if (institution) {
    // Fetch programs belonging strictly to this institution
    const programs = await Program.find({ institutionId: institution._id })
      .populate("facultyId", "name")
      .populate("departmentId", "name")
      .limit(100);

    res.json({
      success: true,
      message: "Institution fetched successfully",
      data: {
        ...institution.toObject(),
        courses: programs, // Retain 'courses' key for easy frontend rendering
      },
    });
  } else {
    res.status(404);
    throw new Error("Institution not found");
  }
});

// @desc    Get all programs with text search, faculty mappers, and JAMB cutoff filters
// @route   GET /api/courses
// @access  Public
export const getCourses = asyncHandler(async (req, res) => {
  const { search, cutoffMark, limit, page } = req.query;

  const query = {};
  const projection = {};
  let sort = { name: 1 };

  // 1. Scalable Text Search
  if (search && search.trim() !== "") {
    query.$text = { $search: search.trim() };
    projection.score = { $meta: "textScore" };
    sort = { score: { $meta: "textScore" } };
  }

  // 2. JAMB Cutoff Filter capability boundaries (cutoff <= studentScore)
  if (cutoffMark && !isNaN(Number(cutoffMark))) {
    query.cutoffMark = { $lte: Number(cutoffMark) };
  }

  // 3. Dynamic Pagination
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 50);
  const skip = (pageNum - 1) * limitNum;

  const programs = await Program.find(query, projection)
    .populate("institutionId", "name location logo state city ownershipType ranking studentPopulation tuition acceptanceRate tags")
    .populate("facultyId", "name")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Program.countDocuments(query);

  res.json({
    success: true,
    message: "Programs fetched successfully",
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
    data: programs,
  });
});

// @desc    Get program by ID
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id)
    .populate("institutionId", "name location logo state city ownershipType ranking studentPopulation tuition acceptanceRate tags")
    .populate("facultyId", "name");

  if (program) {
    res.json({
      success: true,
      message: "Program fetched successfully",
      data: program,
    });
  } else {
    res.status(404);
    throw new Error("Program not found");
  }
});

// @desc    Update program capacity
// @route   PUT /api/programs/:id/capacity
// @access  Private/Admin
export const updateProgramCapacity = asyncHandler(async (req, res) => {
  const { totalCapacity } = req.body;

  if (totalCapacity === undefined) {
    res.status(400);
    throw new Error("Total capacity is required");
  }

  const program = await Program.findById(req.params.id);

  if (!program) {
    res.status(404);
    throw new Error("Program not found");
  }

  program.totalCapacity = Number(totalCapacity);
  await program.save();

  res.json({
    success: true,
    message: "Program capacity updated successfully",
    data: program,
  });
});

