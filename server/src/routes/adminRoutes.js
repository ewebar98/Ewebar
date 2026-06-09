import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import User from "../models/userModel.js";
import { Institution, Program, Faculty, Department } from "../models/universityModel.js";
import { Application } from "../models/applicationModel.js";
import Notification from "../models/notificationModel.js";
import Message from "../models/messageModel.js";
import admissionsService from "../services/admissionsService.js";

const router = express.Router();

// @desc    Get admin analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get(
  "/analytics",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const [studentCount, universityCount, courseCount, applicationCount] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Institution.countDocuments({}),
      Program.countDocuments({}),
      Application.countDocuments({}),
    ]);

    // Applications per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyApps = await Application.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          value: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const applicationsTrend = monthlyApps.map((m) => ({
      month: monthNames[m._id - 1],
      value: m.value,
    }));

    // Faculty mix from courses
    const facultyAgg = await Program.aggregate([
      { $group: { _id: "$faculty", value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 6 },
    ]);
    const facultyMix = facultyAgg.map((f) => ({ name: f._id || "Other", value: f.value }));

    // Top universities by application volume
    const topUnisAgg = await Application.aggregate([
      { $group: { _id: "$universityId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: "institutions", // Aggregated lookup against institutions collection
          localField: "_id",
          foreignField: "_id",
          as: "uni",
        },
      },
      { $unwind: { path: "$uni", preserveNullAndEmptyArrays: true } },
    ]);
    const topUniversities = topUnisAgg.map((u) => ({
      name: u.uni?.name || "Unknown",
      value: u.count,
    }));

    res.json({
      success: true,
      message: "Analytics fetched",
      data: {
        totals: {
          students: studentCount,
          universities: universityCount,
          courses: courseCount,
          applications: applicationCount,
        },
        applicationsTrend: applicationsTrend.length > 0 ? applicationsTrend : [],
        facultyMix: facultyMix.length > 0 ? facultyMix : [],
        topUniversities: topUniversities.length > 0 ? topUniversities : [],
      },
    });
  })
);

// @desc    Get all applications in system for review
// @route   GET /api/admin/applications
// @access  Private/Admin
router.get(
  "/applications",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const applications = await Application.find({})
      .populate("studentId", "fullName email jambScore waecAggregate")
      .populate("universityId", "name logo city state")
      .populate({
        path: "courseId", // Populate course details
        select: "name cutoffMark duration facultyId",
        populate: {
          path: "facultyId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    // Calculate unread chat messages from students for each application
    const appData = await Promise.all(
      applications.map(async (app) => {
        const unreadCount = await Message.countDocuments({
          applicationId: app._id,
          senderRole: "student", // messages sent by students
          read: false,
        });
        
        const appObj = app.toObject();
        appObj.unreadMessagesCount = unreadCount;
        return appObj;
      })
    );

    res.json({
      success: true,
      message: "Admin applications list fetched",
      data: appData,
    });
  })
);

// @desc    Update application evaluation status
// @route   PUT /api/admin/applications/:id/status
// @access  Private/Admin
router.put(
  "/applications/:id/status",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status, notes } = req.body;

    if (!["pending", "reviewed", "accepted", "rejected"].includes(status)) {
      res.status(400);
      throw new Error("Invalid application evaluation status");
    }

    const application = await Application.findById(req.params.id)
      .populate("universityId", "name")
      .populate("courseId", "name");

    if (!application) {
      res.status(404);
      throw new Error("Application not found");
    }

    application.status = status;
    application.auditTrail.push({
      action: `Status Updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      performedBy: req.user.email || "administrator",
      notes: notes || `Application transitioned to ${status} status by administrator.`,
    });

    const updatedApp = await application.save();

    // Trigger context-rich notification for the student
    const uniName = application.universityId?.name || "University";
    const courseName = application.courseId?.name || "Program";
    let title = "Application Update";
    let type = "info";
    let body = `Your application for ${courseName} at ${uniName} has been updated to "${status}".`;

    if (status === "accepted") {
      title = "Application Accepted! 🎉";
      type = "success";
      body = `Congratulations! Your application for ${courseName} at ${uniName} has been ACCEPTED. Review remarks: "${notes || "None"}".`;
    } else if (status === "rejected") {
      title = "Application Status Update";
      type = "error";
      body = `Your application for ${courseName} at ${uniName} has been rejected at this time. Review remarks: "${notes || "None"}".`;
    } else if (status === "reviewed") {
      title = "Application Under Review";
      type = "warning";
      body = `Your application for ${courseName} at ${uniName} is now under active review. Review remarks: "${notes || "None"}".`;
    }

    await Notification.create({
      userId: application.studentId,
      title,
      body,
      type,
      link: "/applications",
    });

    res.json({
      success: true,
      message: "Application evaluation status updated successfully",
      data: updatedApp,
    });
  })
);

// ==========================================
// INSTITUTIONS CRUD ENDPOINTS
// ==========================================

// @desc    Create a new institution (school)
// @route   POST /api/admin/institutions
// @access  Private/Admin
router.post(
  "/institutions",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { name, institutionType, ownershipType, state, city, tuition, acceptanceRate, studentPopulation, ranking, tags } = req.body;

    if (!name || !institutionType || !ownershipType || !state || !city) {
      res.status(400);
      throw new Error("Please provide all required school details (name, type, ownership, state, city)");
    }

    const schoolExists = await Institution.findOne({ name });
    if (schoolExists) {
      res.status(400);
      throw new Error("An institution with this name already exists");
    }

    const newInst = await Institution.create({
      name,
      institutionType,
      ownershipType,
      state,
      city,
      tuition: tuition || "₦150,000/yr",
      acceptanceRate: Number(acceptanceRate) || 25,
      studentPopulation: Number(studentPopulation) || 15000,
      ranking: Number(ranking) || 50,
      tags: tags || [],
    });

    res.status(201).json({
      success: true,
      message: "School created successfully",
      data: newInst,
    });
  })
);

// @desc    Update an existing institution (school)
// @route   PUT /api/admin/institutions/:id
// @access  Private/Admin
router.put(
  "/institutions/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { name, institutionType, ownershipType, state, city, tuition, acceptanceRate, studentPopulation, ranking, tags } = req.body;

    const school = await Institution.findById(req.params.id);
    if (!school) {
      res.status(404);
      throw new Error("School not found");
    }

    // If changing name, ensure uniqueness
    if (name && name !== school.name) {
      const nameExists = await Institution.findOne({ name });
      if (nameExists) {
        res.status(400);
        throw new Error("An institution with this name already exists");
      }
      school.name = name;
      school.slug = undefined; // trigger slug regeneration
    }

    if (institutionType) school.institutionType = institutionType;
    if (ownershipType) school.ownershipType = ownershipType;
    if (state) school.state = state;
    if (city) school.city = city;
    if (tuition !== undefined) school.tuition = tuition;
    if (acceptanceRate !== undefined) school.acceptanceRate = Number(acceptanceRate);
    if (studentPopulation !== undefined) school.studentPopulation = Number(studentPopulation);
    if (ranking !== undefined) school.ranking = Number(ranking);
    if (tags !== undefined) school.tags = tags;

    const updatedSchool = await school.save();

    res.json({
      success: true,
      message: "School updated successfully",
      data: updatedSchool,
    });
  })
);

// @desc    Delete an institution (school)
// @route   DELETE /api/admin/institutions/:id
// @access  Private/Admin
router.delete(
  "/institutions/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const school = await Institution.findById(req.params.id);
    if (!school) {
      res.status(404);
      throw new Error("School not found");
    }

    // Relationally wipe associated programs, departments, and faculties to ensure database consistency
    await Promise.all([
      Program.deleteMany({ institutionId: school._id }),
      Department.deleteMany({ institutionId: school._id }),
      Faculty.deleteMany({ institutionId: school._id }),
      Application.deleteMany({ universityId: school._id }),
    ]);

    await school.deleteOne();

    res.json({
      success: true,
      message: "School and all relationally mapped academic programs successfully deleted",
    });
  })
);

// ==========================================
// FACULTIES CRUD ENDPOINTS
// ==========================================

// @desc    Get all faculties (for administrative dropdowns)
// @route   GET /api/admin/faculties
// @access  Private/Admin
router.get(
  "/faculties",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const faculties = await Faculty.find({}).populate("institutionId", "name");
    res.json({
      success: true,
      data: faculties,
    });
  })
);

// @desc    Create a new faculty
// @route   POST /api/admin/faculties
// @access  Private/Admin
router.post(
  "/faculties",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { institutionId, name } = req.body;

    if (!institutionId || !name) {
      res.status(400);
      throw new Error("Please provide institutionId and faculty name");
    }

    const school = await Institution.findById(institutionId);
    if (!school) {
      res.status(404);
      throw new Error("Associated school not found");
    }

    const newFaculty = await Faculty.create({
      institutionId,
      name,
    });

    res.status(201).json({
      success: true,
      message: "Faculty created successfully",
      data: newFaculty,
    });
  })
);

// @desc    Update a faculty
// @route   PUT /api/admin/faculties/:id
// @access  Private/Admin
router.put(
  "/faculties/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { name } = req.body;

    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      res.status(404);
      throw new Error("Faculty not found");
    }

    if (name) {
      faculty.name = name;
      faculty.slug = undefined; // trigger slug regeneration
    }

    const updatedFaculty = await faculty.save();

    res.json({
      success: true,
      message: "Faculty updated successfully",
      data: updatedFaculty,
    });
  })
);

// @desc    Delete a faculty
// @route   DELETE /api/admin/faculties/:id
// @access  Private/Admin
router.delete(
  "/faculties/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      res.status(404);
      throw new Error("Faculty not found");
    }

    // Clean up departments, programs, and applications mapped to this faculty
    await Promise.all([
      Program.deleteMany({ facultyId: faculty._id }),
      Department.deleteMany({ facultyId: faculty._id }),
    ]);

    await faculty.deleteOne();

    res.json({
      success: true,
      message: "Faculty and all associated departments and programs deleted successfully",
    });
  })
);

// ==========================================
// DEPARTMENTS CRUD ENDPOINTS
// ==========================================

// @desc    Get all departments (for administrative dropdowns)
// @route   GET /api/admin/departments
// @access  Private/Admin
router.get(
  "/departments",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const departments = await Department.find({})
      .populate("institutionId", "name")
      .populate("facultyId", "name");
    res.json({
      success: true,
      data: departments,
    });
  })
);

// @desc    Create a new department
// @route   POST /api/admin/departments
// @access  Private/Admin
router.post(
  "/departments",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { institutionId, facultyId, name } = req.body;

    if (!institutionId || !facultyId || !name) {
      res.status(400);
      throw new Error("Please provide institutionId, facultyId, and department name");
    }

    const [school, faculty] = await Promise.all([
      Institution.findById(institutionId),
      Faculty.findById(facultyId),
    ]);

    if (!school || !faculty) {
      res.status(404);
      throw new Error("Associated school or faculty not found");
    }

    const newDept = await Department.create({
      institutionId,
      facultyId,
      name,
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: newDept,
    });
  })
);

// @desc    Update a department
// @route   PUT /api/admin/departments/:id
// @access  Private/Admin
router.put(
  "/departments/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { name } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department) {
      res.status(404);
      throw new Error("Department not found");
    }

    if (name) {
      department.name = name;
      department.slug = undefined; // trigger slug regeneration
    }

    const updatedDept = await department.save();

    res.json({
      success: true,
      message: "Department updated successfully",
      data: updatedDept,
    });
  })
);

// @desc    Delete a department
// @route   DELETE /api/admin/departments/:id
// @access  Private/Admin
router.delete(
  "/departments/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const department = await Department.findById(req.params.id);
    if (!department) {
      res.status(404);
      throw new Error("Department not found");
    }

    // Clean up programs mapped to this department
    await Program.deleteMany({ departmentId: department._id });

    await department.deleteOne();

    res.json({
      success: true,
      message: "Department and all associated programs deleted successfully",
    });
  })
);

// ==========================================
// PROGRAMS (COURSES) CRUD ENDPOINTS
// ==========================================

// @desc    Create a new program (course)
// @route   POST /api/admin/programs
// @access  Private/Admin
router.post(
  "/programs",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const {
      institutionId,
      facultyId,
      departmentId,
      name,
      duration,
      cutoffMark,
      tuition,
      requirements,
      careerPaths,
      description,
    } = req.body;

    if (!institutionId || !facultyId || !departmentId || !name || !cutoffMark) {
      res.status(400);
      throw new Error("Please provide institutionId, facultyId, departmentId, name, and cutoffMark");
    }

    const [school, faculty, department] = await Promise.all([
      Institution.findById(institutionId),
      Faculty.findById(facultyId),
      Department.findById(departmentId),
    ]);

    if (!school || !faculty || !department) {
      res.status(404);
      throw new Error("Associated school, faculty, or department not found");
    }

    const newProgram = await Program.create({
      institutionId,
      facultyId,
      departmentId,
      name,
      duration: duration || "4 years",
      cutoffMark: Number(cutoffMark),
      tuition: tuition || "₦150,000/yr",
      requirements: requirements || [],
      careerPaths: careerPaths || [],
      description: description || `Professional degree in ${name}.`,
      autoAdmission: req.body.autoAdmission || { enabled: false, mode: "batch", autoAcceptThreshold: 85 },
    });

    res.status(201).json({
      success: true,
      message: "Program created successfully",
      data: newProgram,
    });
  })
);

// @desc    Update a program (course)
// @route   PUT /api/admin/programs/:id
// @access  Private/Admin
router.put(
  "/programs/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const {
      name,
      duration,
      cutoffMark,
      tuition,
      requirements,
      careerPaths,
      description,
        autoAdmission,
    } = req.body;

    const program = await Program.findById(req.params.id);
    if (!program) {
      res.status(404);
      throw new Error("Program not found");
    }

    if (name) {
      program.name = name;
      program.slug = undefined; // trigger slug regeneration
    }

    if (duration !== undefined) program.duration = duration;
    if (cutoffMark !== undefined) program.cutoffMark = Number(cutoffMark);
    if (tuition !== undefined) program.tuition = tuition;
    if (requirements !== undefined) program.requirements = requirements;
    if (careerPaths !== undefined) program.careerPaths = careerPaths;
    if (description !== undefined) program.description = description;
    if (autoAdmission !== undefined) program.autoAdmission = autoAdmission;

    const updatedProgram = await program.save();

    res.json({
      success: true,
      message: "Program updated successfully",
      data: updatedProgram,
    });
  })
);

// @desc    Delete a program (course)
// @route   DELETE /api/admin/programs/:id
// @access  Private/Admin
router.delete(
  "/programs/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const program = await Program.findById(req.params.id);
    if (!program) {
      res.status(404);
      throw new Error("Program not found");
    }

    // Clean up applications mapped to this program
    await Application.deleteMany({ courseId: program._id });

    await program.deleteOne();

    res.json({
      success: true,
      message: "Program successfully deleted from catalog",
    });
  })
);

// @desc    Run batch admissions for a program (accept highest-match pending applications)
// @route   POST /api/admin/programs/:id/run-admissions
// @access  Private/Admin
router.post(
  "/programs/:id/run-admissions",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const programId = req.params.id;
    const performedBy = req.user.email || "admin";
    const result = await admissionsService.runBatchAdmissionsForProgram(programId, performedBy);
    if (result.reason === "program_not_found") {
      res.status(404);
      throw new Error("Program not found");
    }

    res.json({ success: true, message: `Batch admissions completed. Admitted ${result.admitted} students.`, data: result });
  })
);

export default router;
