import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import universityRoutes from "./routes/universityRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import { nosqlSanitizer } from "./middleware/nosqlSanitize.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(nosqlSanitizer); // Sanitize request inputs against NoSQL parameter injection globally
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", universityRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subjects", subjectRoutes);

// Root Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "WeBAR API is running...",
  });
});

// Centralized unauthenticated production health-check pipeline
app.get("/healthz", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "healthy" : "unhealthy";
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  const isHealthy = dbStatus === "healthy";

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? "healthy" : "unhealthy",
    uptime: `${Math.round(uptime)}s`,
    database: dbStatus,
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    },
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Standardize Mongoose invalid hex ObjectId CastError
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Resource not found with malformed ID format: ${err.value}`;
  }

  // Standardize Mongoose validation schema error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(", ");
  }

  // Structured Logging of all unhandled runtime API exceptions
  logger.error(err.message, {
    statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

export default app;
