import { chatWithAI } from "../ai/groqService.js";
import Notification from "../models/notificationModel.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
// @access  Private
export const aiChat = asyncHandler(async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400);
    throw new Error("Please provide message history");
  }

  const response = await chatWithAI(messages);

  res.json({
    success: true,
    message: "AI response generated",
    data: response,
  });
});

// @desc    Get career guidance from AI
// @route   POST /api/ai/career-guidance
// @access  Private
export const careerGuidance = asyncHandler(async (req, res) => {
  const { interest } = req.body;
  
  if (!interest) {
    res.status(400);
    throw new Error("Please provide a career interest");
  }

  const prompt = `Based on my interest in ${interest}, what are the best career paths and universities in Nigeria?`;
  
  const response = await chatWithAI([{ role: "user", content: prompt }]);

  // Trigger AI advisor notification
  await Notification.create({
    userId: req.user._id,
    title: "AI Career Guidance Ready",
    body: `Your custom AI advisor career guidance report for "${interest}" has been successfully compiled.`,
    type: "info",
    link: "/career",
  });

  res.json({
    success: true,
    message: "Career guidance generated",
    data: response,
  });
});
