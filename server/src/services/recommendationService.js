import { Program, Institution } from "../models/universityModel.js";

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
  const programScienceSubjects = ["physics", "chemistry", "biology", "agricultural science"];
  const programArtCommSubjects = ["literature", "government", "economics", "commerce", "history"];

  const hasScienceRequirement = programRequirements.some((r) => programScienceSubjects.includes(r));
  const hasArtCommRequirement = programRequirements.some((r) => programArtCommSubjects.includes(r));

  const studentScienceCount = studentJambSubjectNames.filter((s) => programScienceSubjects.includes(s)).length;
  const studentArtCommCount = studentJambSubjectNames.filter((s) => programArtCommSubjects.includes(s)).length;

  if (hasScienceRequirement && studentScienceCount === 0 && studentJambSubjectNames.length > 0) {
    matches.streamMismatch = true;
    matches.missingPrerequisites.push("Science Stream Match");
  } else if (hasArtCommRequirement && studentArtCommCount === 0 && studentJambSubjectNames.length > 0) {
    matches.streamMismatch = true;
    matches.missingPrerequisites.push("Arts/Commercial Stream Match");
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
 * Generates academic recommendations using indexed database pre-filtering.
 */
export const generateRecommendations = async (user) => {
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

  const programs = await Program.find(query)
    .populate("institutionId")
    .populate("facultyId")
    .limit(100);

  const recommendations = programs
    .map((program) => {
      const { matchPercentage, details } = calculateMatchScore(user, program);
      const institutionName = program.institutionId?.name || "Unknown University";
      
      let explanation = "";
      if (details.streamMismatch) {
        explanation = `Ineligible: Stream mismatch. This is a science/technical program, but you have no science subjects in JAMB.`;
      } else if (details.cutoffStatus === "unmet") {
        explanation = `Ineligible: Your JAMB score (${user.jambScore}) is below the required cutoff of ${program.cutoffMark} for ${program.name}.`;
      } else if (details.missingJambSubjects.length > 0 || details.missingOlevelSubjects.length > 0) {
        const missing = [];
        if (details.missingJambSubjects.length > 0) missing.push(...details.missingJambSubjects.map(s => `${s} (JAMB)`));
        if (details.missingOlevelSubjects.length > 0) missing.push(...details.missingOlevelSubjects.map(s => `${s} (O'Level)`));
        explanation = `Ineligible: Missing prerequisites: ${missing.join(", ")}.`;
      } else {
        explanation = `Eligible: You meet all cutoffs and prerequisites.`;
        if (details.interestMatched) {
          explanation += ` Aligns with your interests in "${user.interests.slice(0, 3).join(", ")}".`;
        }
      }

      return {
        course: program,
        matchPercentage,
        explanation,
        prerequisitesMet: details.prerequisitesMet,
        details,
      };
    })
    // Sort so eligible courses with highest match come first
    .sort((a, b) => {
      if (a.prerequisitesMet && !b.prerequisitesMet) return -1;
      if (!a.prerequisitesMet && b.prerequisitesMet) return 1;
      return b.matchPercentage - a.matchPercentage;
    });

  return recommendations.slice(0, 5); // Return top 5
};
