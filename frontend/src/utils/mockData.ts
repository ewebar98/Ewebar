export const mockUniversities = [
  { id: "uni_1", name: "University of Lagos", location: "Lagos, Nigeria", ranking: 1, students: 57000, acceptance: 22, tuition: "₦120,000/yr", logo: "", tags: ["Federal", "Top-Ranked"] },
  { id: "uni_2", name: "Covenant University", location: "Ota, Ogun", ranking: 4, students: 12000, acceptance: 35, tuition: "₦950,000/yr", logo: "", tags: ["Private", "Tech"] },
  { id: "uni_3", name: "Ahmadu Bello University", location: "Zaria, Kaduna", ranking: 3, students: 35000, acceptance: 28, tuition: "₦95,000/yr", logo: "", tags: ["Federal"] },
  { id: "uni_4", name: "Obafemi Awolowo University", location: "Ile-Ife, Osun", ranking: 2, students: 30000, acceptance: 25, tuition: "₦110,000/yr", logo: "", tags: ["Federal"] },
  { id: "uni_5", name: "Pan-Atlantic University", location: "Lagos", ranking: 6, students: 1800, acceptance: 40, tuition: "₦2,500,000/yr", logo: "", tags: ["Private", "Business"] },
  { id: "uni_6", name: "University of Ibadan", location: "Ibadan, Oyo", ranking: 5, students: 25000, acceptance: 24, tuition: "₦100,000/yr", logo: "", tags: ["Federal", "Research"] },
];

export const mockCourses = [
  { id: "crs_1", name: "Computer Science", faculty: "Sciences", duration: "4 years", cutoff: 240, description: "Algorithms, AI, software engineering and modern systems." },
  { id: "crs_2", name: "Medicine & Surgery", faculty: "Medical Sciences", duration: "6 years", cutoff: 280, description: "Clinical practice, anatomy, and patient care." },
  { id: "crs_3", name: "Mechanical Engineering", faculty: "Engineering", duration: "5 years", cutoff: 250, description: "Design, thermodynamics, and manufacturing systems." },
  { id: "crs_4", name: "Business Administration", faculty: "Management Sciences", duration: "4 years", cutoff: 220, description: "Management, finance, marketing, and strategy." },
  { id: "crs_5", name: "Law", faculty: "Law", duration: "5 years", cutoff: 260, description: "Constitutional, criminal, and corporate law." },
];

export const mockRecommendations = [
  { id: "rec_1", university: "University of Lagos", universityId: "uni_1", course: "Computer Science", courseId: "crs_1", match: 94, cutoff: 240, slots: 120, reason: "Your JAMB score (268) and strong Math grade (A1) align well. UNILAG CS has a 91% graduation rate and high industry placement." },
  { id: "rec_2", university: "Covenant University", universityId: "uni_2", course: "Computer Science", courseId: "crs_1", match: 88, cutoff: 230, slots: 80, reason: "Excellent fit based on your aptitude profile. Covenant offers strong tech mentorship." },
  { id: "rec_3", university: "Obafemi Awolowo University", universityId: "uni_4", course: "Mechanical Engineering", courseId: "crs_3", match: 82, cutoff: 250, slots: 95, reason: "Your Physics score and engineering interest match OAU's program strengths." },
  { id: "rec_4", university: "University of Ibadan", universityId: "uni_6", course: "Medicine & Surgery", courseId: "crs_2", match: 71, cutoff: 280, slots: 60, reason: "Score is competitive but tight; consider strengthening Biology." },
];

export const mockScholarships = [
  { id: "sch_1", name: "MTN Foundation Scholarship", amount: "₦600,000", deadline: "2026-08-15", eligibility: ["JAMB ≥ 250", "Sciences"], sponsor: "MTN Foundation", category: "Merit" },
  { id: "sch_2", name: "Shell Nigeria Bursary", amount: "₦1,200,000", deadline: "2026-06-30", eligibility: ["Engineering", "GPA ≥ 4.0"], sponsor: "Shell Nigeria", category: "STEM" },
  { id: "sch_3", name: "NNPC/Total National Merit", amount: "₦800,000", deadline: "2026-07-20", eligibility: ["Nigerian", "JAMB ≥ 260"], sponsor: "NNPC", category: "Merit" },
  { id: "sch_4", name: "Agbami Medical Scholarship", amount: "₦500,000", deadline: "2026-09-01", eligibility: ["Medicine", "Year 2+"], sponsor: "Agbami Partners", category: "Need" },
  { id: "sch_5", name: "Google Africa Developer Scholarship", amount: "Free training", deadline: "2026-05-25", eligibility: ["18+", "Coding"], sponsor: "Google", category: "Tech" },
];

export const mockNotifications = [
  { id: "n_1", title: "New recommendation available", body: "We found 3 new program matches for you.", time: "2h ago", read: false, type: "info" },
  { id: "n_2", title: "JAMB Registration deadline approaching", body: "12 days left to register.", time: "1d ago", read: false, type: "warning" },
  { id: "n_3", title: "Document verified", body: "Your WAEC result has been verified.", time: "3d ago", read: true, type: "success" },
  { id: "n_4", title: "Application submitted", body: "Your application to UNILAG was received.", time: "1w ago", read: true, type: "success" },
];

export const mockApplications = [
  { id: "app_1", university: "University of Lagos", course: "Computer Science", status: "Under Review", submitted: "2026-04-12", probability: 92 },
  { id: "app_2", university: "Covenant University", course: "Computer Science", status: "Accepted", submitted: "2026-03-28", probability: 88 },
  { id: "app_3", university: "OAU", course: "Mech. Engineering", status: "Submitted", submitted: "2026-04-20", probability: 80 },
  { id: "app_4", university: "Pan-Atlantic", course: "Business Admin", status: "Draft", submitted: "N/A", probability: 65 },
];

export const mockProfile = {
  name: "Ada Eze",
  email: "ada.eze@example.com",
  phone: "+234 802 000 0000",
  dob: "2007-03-14",
  state: "Lagos",
  gender: "Female",
  jambScore: 268,
  waecAggregate: "A1, B2, A1, B3, B2",
  interests: ["AI", "Robotics", "Design", "Entrepreneurship"],
  preferredUniversities: ["UNILAG", "Covenant", "OAU"],
  bio: "Aspiring computer scientist passionate about AI and accessible education.",
};

export const mockChatHistory = [
  { role: "assistant" as const, content: "Hi Ada! I'm your AI admission assistant. Ask me about programs or career paths." },
  { role: "user" as const, content: "What's the best CS school for me?" },
  { role: "assistant" as const, content: "Based on your JAMB score of 268, UNILAG (94% match) and Covenant (88%) are your strongest options. Want me to draft an application?" },
];

export const mockAnalytics = {
  totals: { students: 18420, universities: 184, courses: 200, applications: 8910 },
  applicationsTrend: [
    { month: "Jan", value: 320 }, { month: "Feb", value: 410 }, { month: "Mar", value: 560 },
    { month: "Apr", value: 720 }, { month: "May", value: 890 }, { month: "Jun", value: 1040 },
  ],
  facultyMix: [
    { name: "Sciences", value: 38 }, { name: "Engineering", value: 24 },
    { name: "Medical", value: 18 }, { name: "Business", value: 12 }, { name: "Law", value: 8 },
  ],
};

// Student-facing analytics (premium dashboard widgets)
export const mockStudentAnalytics = {
  probabilityTrend: {
    "7d":  [{ d: "Mon", v: 78 }, { d: "Tue", v: 80 }, { d: "Wed", v: 79 }, { d: "Thu", v: 83 }, { d: "Fri", v: 85 }, { d: "Sat", v: 86 }, { d: "Sun", v: 87 }],
    "30d": Array.from({ length: 30 }, (_, i) => ({ d: `D${i + 1}`, v: 65 + Math.round(Math.sin(i / 3) * 6 + i * 0.7) })),
    "90d": Array.from({ length: 12 }, (_, i) => ({ d: `W${i + 1}`, v: 55 + Math.round(Math.cos(i / 2) * 5 + i * 2.5) })),
  },
  matchByFaculty: [
    { name: "CS", value: 94 },
    { name: "Eng", value: 82 },
    { name: "Med", value: 71 },
    { name: "Biz", value: 68 },
    { name: "Law", value: 54 },
  ],
  applicationFunnel: [
    { stage: "Saved", count: 12 },
    { stage: "Drafted", count: 8 },
    { stage: "Submitted", count: 5 },
    { stage: "Reviewed", count: 3 },
    { stage: "Accepted", count: 1 },
  ],
  skillRadar: [
    { skill: "Math", score: 92 },
    { skill: "Science", score: 88 },
    { skill: "English", score: 78 },
    { skill: "Logic", score: 85 },
    { skill: "Writing", score: 72 },
    { skill: "Research", score: 80 },
  ],
};

export async function getStudentAnalytics(_range: "7d" | "30d" | "90d" = "30d") {
  return mockStudentAnalytics;
}

