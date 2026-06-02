import { Program } from "../models/universityModel.js";

export const calculateMatchScore = (student, program) => {
  let score = 0;
  let weights = {
    jamb: 40,
    subjects: 35,
    interests: 25,
  };

  const matches = {
    jambMatched: false,
    subjectCount: 0,
    requiredCount: 0,
    interestMatched: false,
    prerequisitesMet: true,
    missingPrerequisites: [],
  };

  // 1. JAMB Score (40%)
  if (student.jambScore >= program.cutoffMark) {
    score += weights.jamb;
    matches.jambMatched = true;
  } else if (student.jambScore >= program.cutoffMark - 20) {
    score += weights.jamb * 0.7; // Close match
    matches.jambMatched = true;
  }

  const normalizeSubject = (name) => {
    if (!name) return "";
    const n = name.toLowerCase().trim();
    if (n === "english language" || n === "english") return "english";
    if (n === "general mathematics" || n === "mathematics") return "mathematics";
    return n;
  };

  // 2. Required O'Level Subjects (35%)
  const studentSubjectNames = (student.subjects || []).map((s) => normalizeSubject(s.name));
  const programRequirements = (program.requirements || []).map((r) => normalizeSubject(r));
  matches.requiredCount = programRequirements.length;

  if (programRequirements.length > 0) {
    const matchedSubjects = programRequirements.filter((reqSub) =>
      studentSubjectNames.includes(reqSub)
    );
    matches.subjectCount = matchedSubjects.length;
    const subjectMatchRatio = matchedSubjects.length / programRequirements.length;
    score += subjectMatchRatio * weights.subjects;
  } else {
    // Default subject score if no requirements are strictly indexed
    score += weights.subjects;
  }

  // 3. Faculty/Stream Prerequisite Checks (Strict Safeguard)
  // E.g., Engineering/Tech/Science requires Mathematics and specific electives
  const programNameLower = program.name.toLowerCase();
  const facultyNameLower = (program.facultyId?.name || "").toLowerCase();
  
  if (
    programNameLower.includes("engineer") || 
    programNameLower.includes("computer science") || 
    facultyNameLower.includes("engineering") || 
    facultyNameLower.includes("science")
  ) {
    const hasPhysics = studentSubjectNames.includes("physics");
    const hasMath = studentSubjectNames.includes("mathematics") || studentSubjectNames.includes("further mathematics");
    
    if (!hasMath) {
      matches.prerequisitesMet = false;
      matches.missingPrerequisites.push("Mathematics");
    }
    if (programNameLower.includes("engineer") && !hasPhysics) {
      matches.prerequisitesMet = false;
      matches.missingPrerequisites.push("Physics");
    }

    if (!matches.prerequisitesMet) {
      score = Math.max(0, score - 20); // Impose prerequisite penalty
    }
  }

  // 4. Student Interests & Career Alignment (25%)
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

  return {
    matchPercentage: Math.min(Math.round(score), 100),
    details: matches,
  };
};

/**
 * Generates academic recommendations using indexed database pre-filtering.
 */
export const generateRecommendations = async (user) => {
  // 1. Scalable Database Index Pre-filtering!
  const query = {
    cutoffMark: { $lte: user.jambScore + 15 },
  };

  const programs = await Program.find(query)
    .populate("institutionId")
    .populate("facultyId")
    .limit(100);

  const recommendations = programs
    .map((program) => {
      const { matchPercentage, details } = calculateMatchScore(user, program);
      const institutionName = program.institutionId?.name || "Unknown University";
      
      // Compute explainable matching criteria
      let explanation = `Excellent match! Your JAMB score (${user.jambScore}) meets or exceeds the cutoff of ${program.cutoffMark} for ${program.name} at ${institutionName}.`;
      
      if (!details.prerequisitesMet) {
        explanation = `Alert: Missing core prerequisite O'Level subjects (${details.missingPrerequisites.join(", ")}) required for ${program.name}. Match score has been adjusted accordingly.`;
      } else if (details.interestMatched) {
        explanation += ` This program perfectly aligns with your expressed academic interests in "${user.interests.slice(0, 3).join(", ")}".`;
      }

      return {
        course: program,
        matchPercentage,
        explanation,
      };
    })
    .filter((rec) => rec.matchPercentage >= 40) // Return quality matches
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  return recommendations.slice(0, 5); // Return top 5
};
