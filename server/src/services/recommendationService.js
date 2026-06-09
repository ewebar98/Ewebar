import Recommendation from "../models/recommendationModel.js";
import eventBus from "../utils/eventBus.js";
import { Program, Institution } from "../models/universityModel.js";
import User from "../models/userModel.js";

/**
 * Calculates a strict match score based on JAMB cutoff, JAMB subjects, and O'Level credits.
 */
export const calculateMatchScore = (student, program) => {
  const normalizeSubject = (name) => {
    if (!name) return "";
    const n = name.toLowerCase().trim();
    if (n === "english language" || n === "english" || n === "use of english") return "english";
    if (n === "general mathematics" || n === "mathematics" || n === "maths" || n === "math") return "mathematics";
    if (n === "further mathematics" || n === "further maths") return "further mathematics";
    if (n === "literature-in-english" || n === "literature in english" || n === "literature") return "literature";
    if (n === "agricultural science" || n === "agricultural education" || n === "agric" || n === "agriculture") return "agricultural science";
    return n;
  };

  const isCreditPass = (grade) => {
    if (!grade) return false;
    const g = grade.toUpperCase().trim();
    return ["A1", "B2", "B3", "C4", "C5", "C6", "A", "B", "C"].includes(g);
  };

  let score = 0;
  const weights = {
    jamb: 40,
    subjects: 35,
    interests: 25,
  };

  const matches = {
    jambMatched: false,
    cutoffStatus: student.jambScore >= program.cutoffMark ? "met" : "unmet",
    missingJambSubjects: [],
    missingOlevelSubjects: [],
    prerequisitesMet: true,
    missingPrerequisites: [],
    interestMatched: false,
    streamMismatch: false,
  };

  // 1. JAMB Cutoff Check (40 points)
  if (student.jambScore >= program.cutoffMark) {
    score += weights.jamb;
    matches.jambMatched = true;
  }

  // 2. Prerequisite & Subject Check
  const programRequirements = (program.requirements || []).map((r) => normalizeSubject(r));
  const studentJambSubjectNames = (student.jambSubjects || []).map((s) => normalizeSubject(s.name));
  const studentOlevelSubjectMap = {};
  (student.subjects || []).forEach((s) => {
    studentOlevelSubjectMap[normalizeSubject(s.name)] = s.grade;
  });

  // Strict JAMB and O'Level checks
  programRequirements.forEach((reqSub) => {
    const originalName = reqSub.charAt(0).toUpperCase() + reqSub.slice(1);
    
    // Core JAMB subjects check
    const standardJambSubjects = [
      "english", "mathematics", "physics", "chemistry", "biology", 
      "economics", "government", "literature", "geography", 
      "agricultural science", "commerce", "history"
    ];
    
    if (standardJambSubjects.includes(reqSub)) {
      if (!studentJambSubjectNames.includes(reqSub)) {
        matches.missingJambSubjects.push(originalName);
        matches.missingPrerequisites.push(`JAMB: ${originalName}`);
      }
    }

    // O'Level credit pass check
    const grade = studentOlevelSubjectMap[reqSub];
    if (!grade || !isCreditPass(grade)) {
      matches.missingOlevelSubjects.push(originalName);
      matches.missingPrerequisites.push(`O'Level: ${originalName} (Credit)`);
    }
  });

  // 3. Stream Alignment Check
  const programScienceSubjects = ["physics", "chemistry", "biology", "agricultural science", "further mathematics"];
  const programArtCommSubjects = ["literature", "government", "economics", "commerce", "history"];

  const isScienceCourse = programRequirements.some((r) => programScienceSubjects.includes(r)) ||
                          ["science", "engineering", "technology", "agriculture", "medical", "architecture"].some(word => program.name?.toLowerCase().includes(word));

  const studentScienceJambCount = studentJambSubjectNames.filter((s) => programScienceSubjects.includes(s)).length;
  const studentScienceOlevelCount = Object.keys(studentOlevelSubjectMap).filter((s) => programScienceSubjects.includes(s)).length;
  const studentArtCommJambCount = studentJambSubjectNames.filter((s) => programArtCommSubjects.includes(s)).length;

  if (isScienceCourse) {
    if ((studentScienceJambCount === 0 && studentJambSubjectNames.length > 0) ||
        (studentScienceOlevelCount === 0 && Object.keys(studentOlevelSubjectMap).length > 0) ||
        (studentArtCommJambCount >= 2)) {
      matches.streamMismatch = true;
      matches.missingPrerequisites.push("Strict Subject Combination Match (Arts student applying for Science)");
    }
  }

  // Calculate O'level score component (35 points)
  if (programRequirements.length > 0) {
    const passedCount = programRequirements.length - matches.missingOlevelSubjects.length;
    const ratio = Math.max(0, passedCount / programRequirements.length);
    score += ratio * weights.subjects;
  } else {
    score += weights.subjects;
  }

  // 4. Student Interests Alignment (25 points)
  if (student.interests && student.interests.length > 0 && program.name) {
    const programNameWords = program.name.toLowerCase().split(" ");
    const matchedInterests = student.interests.filter((interest) =>
      programNameWords.some((word) =>
        word.includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(word)
      )
    );
    if (matchedInterests.length > 0) {
      score += weights.interests;
      matches.interestMatched = true;
    }
  }

  // Determine final prerequisites status
  if (
    matches.cutoffStatus === "unmet" ||
    matches.missingJambSubjects.length > 0 ||
    matches.missingOlevelSubjects.length > 0 ||
    matches.streamMismatch
  ) {
    matches.prerequisitesMet = false;
  }

  // Penalize score strictly if prerequisites not met
  let matchPercentage = Math.min(Math.round(score), 100);
  if (!matches.prerequisitesMet) {
    if (matches.streamMismatch) {
      matchPercentage = 0;
    } else {
      // Deduct score significantly or cap at 30% to make it ineligible
      matchPercentage = Math.min(matchPercentage, 35);
    }
  }

  return {
    matchPercentage,
    details: matches,
  };
};

/**
 * Generates structured explainability breakdown and recourse actions
 * per the Explainability Framework & Personalized Recourse System spec.
 */
const buildExplainability = (student, program, details, matchPercentage) => {
  // --- Decision Breakdown ---
  const breakdown = [];

  // JAMB cutoff check
  if (details.cutoffStatus === "met") {
    breakdown.push({ type: "PASS", field: "UTME Score", message: `${student.jambScore} — Meets program cutoff of ${program.cutoffMark}` });
  } else {
    breakdown.push({ type: "FAIL", field: "UTME Score", message: `${student.jambScore} — Below required cutoff of ${program.cutoffMark}` });
  }

  // Stream alignment
  if (details.streamMismatch) {
    breakdown.push({ type: "FAIL", field: "Stream Alignment", message: "Stream mismatch detected. Your subjects do not align with the science/technical requirements of this program." });
  } else {
    breakdown.push({ type: "PASS", field: "Stream Alignment", message: "Subject stream is aligned with program requirements." });
  }

  // Missing O'Level subjects
  if (details.missingOlevelSubjects.length === 0) {
    breakdown.push({ type: "PASS", field: "O'Level Prerequisites", message: "All required O'Level credit passes are verified." });
  } else {
    const borderline = details.missingOlevelSubjects.length === 1;
    breakdown.push({
      type: borderline ? "WARN" : "FAIL",
      field: "O'Level Prerequisites",
      message: `Missing credit pass in: ${details.missingOlevelSubjects.join(", ")}.`,
    });
  }

  // JAMB subjects
  if (details.missingJambSubjects.length === 0) {
    breakdown.push({ type: "PASS", field: "JAMB Subjects", message: "All required JAMB subjects are present." });
  } else {
    breakdown.push({ type: "WARN", field: "JAMB Subjects", message: `Missing JAMB subjects: ${details.missingJambSubjects.join(", ")}.` });
  }

  // Interest alignment
  if (details.interestMatched) {
    breakdown.push({ type: "PASS", field: "Interest Alignment", message: "Program aligns with your stated interests." });
  }

  // Confidence level per spec
  const confidence = matchPercentage >= 80 ? "High" : matchPercentage >= 50 ? "Medium" : "Low";

  // --- Recourse Actions ---
  const recourseActions = [];

  if (student.jambScore < 200 && !details.jambMatched) {
    recourseActions.push({
      code: "REWRITE_JAMB",
      type: "critical",
      message: `Your UTME score of ${student.jambScore} is below the 200 threshold required for admission. We recommend registering for the next JAMB UTME and targeting a score of 200+.`,
      actionLink: "/profile",
    });
  } else if (details.cutoffStatus === "unmet") {
    const pointsNeeded = program.cutoffMark - student.jambScore;
    recourseActions.push({
      code: "CHANGE_OF_COURSE",
      type: "advisory",
      message: `Your UTME score (${student.jambScore}) is ${pointsNeeded} points below the ${program.cutoffMark} cutoff for ${program.name}. Consider changing your preferred program to a related course with a lower cutoff.`,
      actionLink: "/recommendations",
    });
  }

  if (details.missingOlevelSubjects.length > 0) {
    recourseActions.push({
      code: "OLEVEL_RESIT",
      type: "error",
      message: `You do not have a verified O'Level credit pass in: ${details.missingOlevelSubjects.join(", ")}. We recommend registering for the WAEC/NECO GCE Nov/Dec exams to obtain these credits.`,
      actionLink: "/documents",
    });
  }

  if (details.streamMismatch) {
    recourseActions.push({
      code: "STREAM_CORRECTION",
      type: "critical",
      message: "A subject stream mismatch was detected. Your subject combination fits the Arts/Commercial stream, but your preferred course requires Science prerequisites. We suggest exploring courses matching your subject stream.",
      actionLink: "/recommendations",
    });
  }

  return { breakdown, confidence, recourseActions };
};

/**
 * Generates academic recommendations using indexed database pre-filtering.
 */
export const generateRecommendations = async (user) => {
  // existing function unchanged
  const jambScore = Number(user.jambScore) || 0;

  // Constrain recommendations strictly to LASUSTECH
  const lasustech = await Institution.findOne({
    $or: [
      { name: "Lagos State University of Science and Technology" },
      { name: "LASUSTECH" }
    ]
  });

  // Query all programs at LASUSTECH to evaluate matches
  const query = {};
  if (lasustech) {
    query.institutionId = lasustech._id;
  }
  query.cutoffMark = { $lte: jambScore };

  const programs = await Program.find(query)
    .populate("institutionId")
    .populate("facultyId")
    .limit(100);

  const recommendations = programs
    .map((program) => {
      const { matchPercentage, details } = calculateMatchScore(user, program);
      const { breakdown, confidence, recourseActions } = buildExplainability(user, program, details, matchPercentage);

      // Real-time seat check: flag if program is at or over capacity
      const slotsAvailable = Math.max(0, (program.totalCapacity || 0) - (program.currentAdmitted || 0));
      const isFull = program.totalCapacity > 0 && slotsAvailable === 0;

      return {
        course: program,
        matchPercentage,
        breakdown,
        confidence,
        recourseActions,
        slotsAvailable: program.totalCapacity > 0 ? slotsAvailable : null,
        isFull,
        prerequisitesMet: details.prerequisitesMet,
        details,
      };
    })
    // Only courses the applicant can actually apply for should be recommended.
    .filter((r) => r.prerequisitesMet)
    .sort((a, b) => {
      // Per spec: push full programs to bottom, open-capacity programs to top
      if (a.isFull !== b.isFull) return a.isFull ? 1 : -1;
      return b.matchPercentage - a.matchPercentage;
    });

  return recommendations.slice(0, 5); // Return top 5
};

/**
 * Recalculates recommendations for all users when a program or rule changes.
 * @param {string} programId - The ID of the affected program.
 */
export const recalculateRecommendations = async (programId) => {
  try {
    // For now, recompute for all users (could be optimized later).
    const users = await User.find({});
    for (const user of users) {
      const rawRecs = await generateRecommendations(user);
      await Recommendation.findOneAndUpdate(
        { userId: user._id },
        {
          recommendedCourses: rawRecs.map((r) => ({
            courseId: r.course._id,
            matchPercentage: r.matchPercentage,
            explanation: r.explanation,
          })),
          matchPercentage: rawRecs.length > 0 ? rawRecs[0].matchPercentage : 0,
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error('Error during recommendation recalculation:', err);
  }
};

// Event listeners to trigger recalculation
eventBus.on('RULE_CHANGED', async ({ programId }) => {
  await recalculateRecommendations(programId);
});

eventBus.on('PROGRAM_UPDATED', async ({ programId }) => {
  await recalculateRecommendations(programId);
});

eventBus.on('CAPACITY_UPDATED', async ({ programId }) => {
  await recalculateRecommendations(programId);
});

/**
 * Recalculates recommendations for a single user.
 * @param {string} userId - The ID of the user whose recommendations should be refreshed.
 */
export const recalculateForUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User ${userId} not found for recommendation refresh`);
      return;
    }
    const rawRecs = await generateRecommendations(user);
    await Recommendation.findOneAndUpdate(
      { userId },
      {
        recommendedCourses: rawRecs.map((r) => ({
          courseId: r.course._id,
          matchPercentage: r.matchPercentage,
          explanation: r.explanation,
        })),
        matchPercentage: rawRecs.length > 0 ? rawRecs[0].matchPercentage : 0,
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('Error during per-user recommendation recalculation:', err);
  }
};

// Event listeners for per-user updates
eventBus.on('USER_PROFILE_UPDATED', async ({ userId }) => {
  await recalculateForUser(userId);
});

eventBus.on('APPLICATION_SUBMITTED', async ({ userId }) => {
  await recalculateForUser(userId);
});
