import { Scholarship } from "../models/scholarshipModel.js";
import { Application } from "../models/applicationModel.js";
import { Institution, Program } from "../models/universityModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import Message from "../models/messageModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { chatWithAI } from "../ai/groqService.js";

// @desc    Get all scholarships
// @route   GET /api/scholarships
// @access  Public
export const getScholarships = asyncHandler(async (req, res) => {
  const scholarships = await Scholarship.find({});
  res.json({
    success: true,
    message: "Scholarships fetched successfully",
    data: scholarships,
  });
});

// @desc    Apply for a course
// @route   POST /api/applications/apply
// @access  Private
export const applyForCourse = asyncHandler(async (req, res) => {
  const { universityId, courseId, documents } = req.body;

  if (!universityId || !courseId) {
    res.status(400);
    throw new Error("University ID and Program (Course) ID are required");
  }

  // 1. Validate University & Program existence
  const university = await Institution.findById(universityId);
  if (!university) {
    res.status(404);
    throw new Error("Institution not found");
  }

  const program = await Program.findById(courseId);
  if (!program) {
    res.status(404);
    throw new Error("Program not found");
  }

  // 2. Fetch student's profile to compute exact match probability score
  const student = await User.findById(req.user._id);
  if (!student) {
    res.status(404);
    throw new Error("Student profile not found");
  }

  const jamb = student.jambScore || 180;
  const cutoff = program.cutoffMark || 200;

  // Admission match probability calculation logic
  let calculatedMatchScore = 85; 
  if (jamb >= cutoff) {
    calculatedMatchScore = Math.min(98, 85 + Math.round((jamb - cutoff) * 0.8));
  } else {
    calculatedMatchScore = Math.max(30, 85 - Math.round((cutoff - jamb) * 1.5));
  }

  // 3. Create persistent Application document with selected documents
  const application = await Application.create({
    studentId: req.user._id,
    universityId,
    courseId,
    matchScore: calculatedMatchScore,
    documents: documents || [],
  });

  // Trigger application submission notification
  await Notification.create({
    userId: req.user._id,
    title: "Application Submitted Successfully",
    body: `Your application for ${program.name} at ${university.name} has been received. Your computed admission match likelihood is ${calculatedMatchScore}%.`,
    type: "info",
    link: "/applications",
  });

  res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    data: application,
  });
});

// @desc    Get user applications
// @route   GET /api/applications
// @access  Private
export const getUserApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ studentId: req.user._id })
    .populate("universityId", "name city state logo")
    .populate({
      path: "courseId",
      select: "name cutoffMark duration facultyId",
      populate: {
        path: "facultyId",
        select: "name",
      },
    });

  // Calculate unread chat messages for each application in parallel
  const appData = await Promise.all(
    applications.map(async (app) => {
      const unreadCount = await Message.countDocuments({
        applicationId: app._id,
        senderRole: { $ne: "student" }, // messages sent by admins/schoolAdmins
        read: false,
      });
      
      const appObj = app.toObject();
      appObj.unreadMessagesCount = unreadCount;
      return appObj;
    })
  );

  res.json({
    success: true,
    message: "Applications fetched successfully",
    data: appData,
  });
});

// @desc    Get all messages for an application
// @route   GET /api/applications/:id/messages
// @access  Private
export const getApplicationMessages = asyncHandler(async (req, res) => {
  const applicationId = req.params.id;

  // 1. Verify application exists and that the user is authorized to access it
  const application = await Application.findById(applicationId);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  // User must be either the student who created the application or an admin
  if (
    req.user.role !== "admin" &&
    req.user.role !== "schoolAdmin" &&
    application.studentId.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to view messages for this application");
  }

  // 2. Automatically mark messages sent by the counterparty as read
  const senderRoleQuery = req.user.role === "student"
    ? { senderRole: { $ne: "student" } }
    : { senderRole: "student" };

  await Message.updateMany(
    {
      applicationId,
      ...senderRoleQuery,
      read: false,
    },
    {
      $set: { read: true },
    }
  );

  // 3. Fetch all messages
  const messages = await Message.find({ applicationId })
    .populate("senderId", "fullName email")
    .sort({ createdAt: 1 });

  res.json({
    success: true,
    message: "Messages fetched successfully",
    data: messages,
  });
});

// @desc    Send a message for an application
// @route   POST /api/applications/:id/messages
// @access  Private
export const sendApplicationMessage = asyncHandler(async (req, res) => {
  const applicationId = req.params.id;
  const { message } = req.body;

  if (!message || message.trim() === "") {
    res.status(400);
    throw new Error("Message content cannot be empty");
  }

  // 1. Verify application exists and that the user is authorized to access it
  const application = await Application.findById(applicationId)
    .populate("universityId", "name")
    .populate("courseId", "name");

  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  // User must be either the student who created the application or an admin
  if (
    req.user.role !== "admin" &&
    req.user.role !== "schoolAdmin" &&
    application.studentId.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to send messages for this application");
  }

  // 2. Create the message
  const newMessage = await Message.create({
    applicationId,
    senderId: req.user._id,
    senderRole: req.user.role,
    message: message.trim(),
    read: false,
  });

  // Populate sender info for the response
  const populatedMessage = await Message.findById(newMessage._id).populate("senderId", "fullName email");

  // 3. Trigger context-rich notification for the counterparty
  const courseName = application.courseId?.name || "Program";
  const universityName = application.universityId?.name || "University";
  const shortSnippet = message.length > 60 ? `${message.substring(0, 57)}...` : message;

  if (req.user.role === "student") {
    // Notify the admin(s)
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await Notification.create({
        userId: admin._id,
        title: `New Message from ${req.user.fullName}`,
        body: `Regarding application for ${courseName} at ${universityName}: "${shortSnippet}"`,
        type: "info",
        link: "/admin/applications",
      });
    }
  } else {
    // Notify the student
    await Notification.create({
      userId: application.studentId,
      title: "New Admissions Message",
      body: `An officer sent a message regarding your application for ${courseName} at ${universityName}: "${shortSnippet}"`,
      type: "info",
      link: "/applications",
    });
  }

  res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: populatedMessage,
  });
});

// @desc    Mark all messages as read for an application
// @route   PUT /api/applications/:id/messages/read
// @access  Private
export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const applicationId = req.params.id;

  const application = await Application.findById(applicationId);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  // User must be either the student who created the application or an admin
  if (
    req.user.role !== "admin" &&
    req.user.role !== "schoolAdmin" &&
    application.studentId.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized");
  }

  // Mark all counterparty messages as read
  const senderRoleQuery = req.user.role === "student"
    ? { senderRole: { $ne: "student" } }
    : { senderRole: "student" };

  await Message.updateMany(
    {
      applicationId,
      ...senderRoleQuery,
      read: false,
    },
    {
      $set: { read: true },
    }
  );

  res.json({
    success: true,
    message: "Messages marked as read successfully",
  });
});

// @desc    Evaluate application (e.g. reject due to capacity and suggest alternatives)
// @route   PUT /api/applications/:id/evaluate
// @access  Private/Admin
export const evaluateApplication = asyncHandler(async (req, res) => {
  const applicationId = req.params.id;
  const { status, actionReason } = req.body;

  const application = await Application.findById(applicationId)
    .populate("studentId", "fullName email jambScore interests preferredLocation")
    .populate("universityId", "name")
    .populate("courseId", "name facultyId cutoffMark");

  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  // Update status
  if (status) {
    application.status = status;
  }

  // If rejected due to capacity, trigger AI alternative recommendations
  if (status === "rejected" && actionReason === "capacity") {
    const student = application.studentId;
    const currentCourse = application.courseId;

    // 1. Query for Real Alternatives in the DB
    // Programs in the same faculty, where cutoff is met, with available capacity
    const alternatives = await Program.find({
      facultyId: currentCourse.facultyId,
      _id: { $ne: currentCourse._id },
      cutoffMark: { $lte: student.jambScore || 200 },
      $expr: { $lt: ["$currentAdmitted", "$totalCapacity"] }
    }).limit(3).select("name cutoffMark duration careerPaths description");

    if (alternatives.length > 0) {
      // 2. Build strict prompt for Groq AI
      const prompt = `
        You are an expert academic advisor. An admin has marked the department "${currentCourse.name}" as full.
        The student "${student.fullName}" (JAMB Score: ${student.jambScore}, Interests: ${student.interests.join(", ")}) applied but cannot be admitted.
        
        CRITICAL RULES:
        1. DO NOT say "you are rejected due to capacity".
        2. Use a soft, statistical tone. For example: "Based on recent admission trends and capacity, you have a 90% chance of not entering the ${currentCourse.name} department."
        3. Recommend these exact alternative departments retrieved from our database: ${alternatives.map(a => a.name).join(", ")}.
        4. Explicitly explain WHY the student is a good fit for these alternative departments based on their profile (interests, score).
      `;

      // 3. Generate AI Message
      const aiResponse = await chatWithAI([{ role: "user", content: prompt }]);

      // 4. Save AI Response as a Message
      await Message.create({
        applicationId,
        senderId: req.user._id, // Admin's ID
        senderRole: req.user.role,
        message: aiResponse,
        read: false,
      });

      // 5. Create Notification for student
      await Notification.create({
        userId: student._id,
        title: "Important Update on your Application",
        body: `We have new insights regarding your application to ${currentCourse.name}. Please check your application messages for an academic advisory update.`,
        type: "info",
        link: "/applications",
      });
    }
  }

  // Add to audit trail
  application.auditTrail.push({
    action: \`Application evaluated: \${status}\`,
    performedBy: req.user.email || "admin",
    notes: actionReason ? \`Reason: \${actionReason}\` : "",
  });

  await application.save();

  res.json({
    success: true,
    message: "Application evaluated successfully",
    data: application,
  });
});
