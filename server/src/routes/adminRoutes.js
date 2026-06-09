import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
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
