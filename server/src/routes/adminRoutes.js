import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import { Institution, Program, Faculty } from "../models/universityModel.js";
import { Application } from "../models/applicationModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";


const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// Helper: derive category from role
function categoryFromRole(role) {
  if (role === "student") return "student";
  if (role === "admin" || role === "manager" || role === "schoolAdmin") return "management";
  return "staff"; // staff, customerCare
}

// Helper: generate a secure random password
function generateSecurePassword(length = 12) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "@#$!%*?&";
  const all = upper + lower + digits + special;

  let password =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Admin only
router.get(
  "/analytics",
  asyncHandler(async (req, res) => {
    // 1. Totals
    const [students, institutions, programs, applications] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Institution.countDocuments({}),
      Program.countDocuments({}),
      Application.countDocuments({}),
    ]);

    // 2. Applications Trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const trendData = await Application.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const applicationsTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = months[d.getMonth()];
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;

      const matched = trendData.find(
        (t) => t._id.year === year && t._id.month === monthNum
      );
      applicationsTrend.push({
        month: mLabel,
        value: matched ? matched.count : 0,
      });
    }

    // 3. Faculty Mix
    const facultyData = await Program.aggregate([
      {
        $group: {
          _id: "$facultyId",
          count: { $sum: 1 },
        },
      },
    ]);

    const faculties = await Faculty.find({
      _id: { $in: facultyData.map((f) => f._id).filter(Boolean) },
    });

    const facultyMix = facultyData.map((fd) => {
      const faculty = faculties.find((f) => String(f._id) === String(fd._id));
      return {
        name: faculty ? faculty.name : "Other",
        value: fd.count,
      };
    });

    // 4. Top Universities (Top 5 by application count)
    const topUnisData = await Application.aggregate([
      {
        $group: {
          _id: "$universityId",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const unis = await Institution.find({
      _id: { $in: topUnisData.map((tu) => tu._id).filter(Boolean) },
    });

    const topUniversities = topUnisData.map((tu) => {
      const uni = unis.find((u) => String(u._id) === String(tu._id));
      return {
        name: uni ? uni.name : "Unknown",
        value: tu.count,
      };
    });

    // 5. Program Capacities
    const activePrograms = await Program.find({})
      .populate("institutionId", "name")
      .sort({ currentAdmitted: -1 })
      .limit(10);

    const programCapacities = activePrograms.map((p) => ({
      id: p._id,
      name: p.name,
      institution: p.institutionId ? p.institutionId.name : "Unknown",
      capacity: p.totalCapacity || 100,
      admitted: p.currentAdmitted || 0,
    }));

    res.json({
      success: true,
      data: {
        totals: {
          students,
          universities: institutions,
          courses: programs,
          applications,
        },
        applicationsTrend,
        facultyMix,
        topUniversities,
        programCapacities,
      },
    });
  })
);

// @desc    List all users with optional filters
// @route   GET /api/admin/users
// @access  Admin only
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { role, category, search } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    const grouped = {
      students: users.filter((u) => u.category === "student"),
      staff: users.filter((u) => u.category === "staff"),
      management: users.filter((u) => u.category === "management"),
    };

    res.json({
      success: true,
      data: {
        all: users,
        grouped,
        totals: {
          students: grouped.students.length,
          staff: grouped.staff.length,
          management: grouped.management.length,
          total: users.length,
        },
      },
    });
  })
);

// @desc    Create a new user account (for staff/managers)
// @route   POST /api/admin/users
// @access  Admin only
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const { fullName, email, role, password: customPassword } = req.body;

    if (!fullName || !email || !role) {
      res.status(400);
      throw new Error("fullName, email, and role are required");
    }

    const validRoles = ["student", "staff", "manager", "customerCare", "schoolAdmin", "admin"];
    if (!validRoles.includes(role)) {
      res.status(400);
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }

    const exists = await User.findOne({ email });
    if (exists) {
      res.status(409);
      throw new Error("A user with this email already exists");
    }

    const plainPassword = customPassword || generateSecurePassword();
    const category = categoryFromRole(role);

    const user = await User.create({
      fullName,
      email,
      password: plainPassword,
      role,
      category,
      createdByAdmin: true,
      mustChangePassword: !customPassword,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "User account created",
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        category: user.category,
        createdAt: user.createdAt,
        generatedPassword: plainPassword,
      },
    });
  })
);

// @desc    Update a user's role
// @route   PATCH /api/admin/users/:id/role
// @access  Admin only
router.patch(
  "/users/:id/role",
  asyncHandler(async (req, res) => {
    const { role } = req.body;

    const validRoles = ["student", "staff", "manager", "customerCare", "schoolAdmin", "admin"];
    if (!validRoles.includes(role)) {
      res.status(400);
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (String(user._id) === String(req.user._id) && role !== "admin") {
      res.status(400);
      throw new Error("You cannot change your own admin role");
    }

    user.role = role;
    user.category = categoryFromRole(role);
    await user.save();

    res.json({
      success: true,
      message: "User role updated",
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        category: user.category,
      },
    });
  })
);

// @desc    Generate a new password for a user
// @route   POST /api/admin/users/:id/generate-password
// @access  Admin only
router.post(
  "/users/:id/generate-password",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("+password");
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const plainPassword = generateSecurePassword();
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(plainPassword, salt);
    user.mustChangePassword = true;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: "New password generated. Share this with the user — it will not be shown again.",
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        generatedPassword: plainPassword,
      },
    });
  })
);

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/status
// @access  Admin only
router.patch(
  "/users/:id/status",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (String(user._id) === String(req.user._id)) {
      res.status(400);
      throw new Error("You cannot deactivate your own account");
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"}`,
      data: { _id: user._id, isActive: user.isActive },
    });
  })
);

// @desc    Delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Admin only
router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.user._id)) {
      res.status(400);
      throw new Error("You cannot delete your own account");
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json({
      success: true,
      message: `Account for ${user.fullName} has been deleted`,
    });
  })
);

export default router;
