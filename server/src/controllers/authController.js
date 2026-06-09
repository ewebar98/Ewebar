import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role: "student", // Strictly enforce default student role for public registration
  });

  if (user) {
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Temporary endpoint to patch admin
// @route   GET /api/auth/patch-admin
// @access  Public
export const patchAdmin = asyncHandler(async (req, res) => {
  const existingAdmin = await User.findOne({ email: "hennycolour@gmail.com" });
  if (existingAdmin) {
    existingAdmin.password = "Lasustech123@";
    await existingAdmin.save();
    return res.json({ success: true, message: "Admin password updated successfully" });
  }

  await User.create({
    fullName: "Henny Colour",
    email: "hennycolour@gmail.com",
    password: "Lasustech123@",
    role: "admin",
  });

  res.json({ success: true, message: "New admin created successfully" });
});
