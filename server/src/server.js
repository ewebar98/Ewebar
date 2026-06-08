import dotenv from "dotenv";
import { validateEnvironment } from "./config/envValidate.js";
import https from "node:https";
import http from "node:http";

import logger from "./utils/logger.js";

// Initialize environment variables first
dotenv.config();

// Global process-level safety nets to prevent uncaught errors from crash-looping the server
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`CRITICAL: Unhandled Rejection at promise: ${promise}`, { reason: String(reason) });
});

process.on("uncaughtException", (error) => {
  logger.error("CRITICAL: Uncaught Exception thrown", { error: error.message, stack: error.stack });
});

// Ensure all critical enterprise configurations are present
validateEnvironment();

import app from "./app.js";
import connectDB from "./config/db.js";
import Subject from "./models/subjectModel.js";

const PORT = process.env.PORT || 5000;

// Database migration: clean up decommissioned subjects
const cleanDecommissionedSubjects = async () => {
  try {
    const result = await Subject.deleteMany({
      name: { $in: ["Physical Education", "Integrated Science", "Health Science / Health Education"] }
    });
    if (result.deletedCount > 0) {
      console.log(`[Migration] Cleaned up ${result.deletedCount} decommissioned subjects from the database.`);
    }
  } catch (err) {
    console.error("[Migration Error] Failed to clean up decommissioned subjects:", err.message);
  }
};

// Connect to Database
connectDB().then(() => {
  cleanDecommissionedSubjects();
});

const keepAlive = () => {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (!url) {
    console.log("[Keep-Alive] RENDER_EXTERNAL_URL is not configured. Skipping self-ping keep-alive.");
    return;
  }

  const endpoint = `${url.replace(/\/$/, "")}/healthz`;
  console.log(`[Keep-Alive] Configuring self-ping keep-alive for Render at: ${endpoint}`);

  // Ping every 10 minutes (600000ms) to ensure Render doesn't spin down the container
  const PING_INTERVAL = 10 * 60 * 1000;

  setInterval(() => {
    console.log(`[Keep-Alive] Triggering self-ping to: ${endpoint}`);
    const client = endpoint.startsWith("https") ? https : http;
    client.get(endpoint, (res) => {
      console.log(`[Keep-Alive] Self-ping response status: ${res.statusCode}`);
    }).on("error", (err) => {
      console.error(`[Keep-Alive Warning] Self-ping failed:`, err.message);
    });
  }, PING_INTERVAL);
};

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  // Engage self-ping keep-alive loop for Render deployments
  keepAlive();
});
