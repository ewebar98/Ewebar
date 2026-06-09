import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { validate, registerSchema, loginSchema } from "../middleware/validationMiddleware.js";
import { rateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Apply tight rate-limiting to authentication endpoints
const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Max 10 attempts
  message: "Too many login or registration attempts. Please try again after 15 minutes.",
});

router.post("/register", authRateLimit, validate(registerSchema), registerUser);
router.post("/login", authRateLimit, validate(loginSchema), loginUser);

export default router;
