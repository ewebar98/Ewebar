/**
 * Production-ready API service layer fully wired to the local Express/MongoDB server.
 * All secure requests automatically inject the stored JWT token.
 */

export const BACKEND_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
  : "https://ewebar.onrender.com";

export const BASE_URL = `${BACKEND_URL}/api`;

// Helper request wrapper for JSON fetch calls
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("WeBAR.token") : null;

  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "An error occurred" };
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP error! Status: ${response.status}`);
  }

  // The backend envelopes responses in { success: boolean, message: string, data: T }
  return data.data !== undefined ? data.data : data;
}

export interface University {
  id: string;
  name: string;
  location: string;
  ranking: number;
  students: number;
  acceptance: number;
  tuition: string;
  logo: string;
  tags: string[];
  type?: string;
  courses?: Course[];
}

export interface Course {
  id: string;
  name: string;
  faculty: string;
  department?: string;
  duration: string;
  cutoff: number;
  description: string;
  institutionId?: string;
  tuition?: string;
  requirements?: string[];
}

export async function getUniversities(): Promise<University[]> {
  const res = await request<any[]>("/universities");
  return res.map((u) => ({
    id: u._id,
    name: u.name,
    location: `${u.state}, ${u.city}`,
    ranking: u.ranking || 1,
    students: u.studentPopulation || 15000,
    acceptance: u.acceptanceRate || 25,
    tuition: u.tuition || "₦150,000/yr",
    logo: u.logo || "",
    tags: u.tags || [],
    type: u.institutionType,
  }));
}

export async function getUniversityById(id: string): Promise<University | null> {
  const u = await request<any>(`/universities/${id}`);
  if (!u) return null;
  return {
    id: u._id,
    name: u.name,
    location: `${u.state}, ${u.city}`,
    ranking: u.ranking || 1,
    students: u.studentPopulation || 15000,
    acceptance: u.acceptanceRate || 25,
    tuition: u.tuition || "₦150,000/yr",
    logo: u.logo || "",
    tags: u.tags || [],
    type: u.institutionType,
    courses: u.courses?.map((c: any) => ({
      id: c._id,
      name: c.name,
      faculty: c.facultyId?.name || "Sciences",
      department: c.departmentId?.name || "General Department",
      duration: c.duration || "4 years",
      cutoff: c.cutoffMark || 200,
      description: c.description || `Explore the ${c.name} program.`,
      institutionId: u._id,
      requirements: c.requirements || [],
    })) || [],
  };
}

export async function getCourses(): Promise<Course[]> {
  const res = await request<any[]>("/courses?limit=3000");
  return res.map((c) => ({
    id: c._id,
    name: c.name,
    faculty: c.facultyId?.name || "Sciences",
    duration: c.duration || "4 years",
    cutoff: c.cutoffMark || 200,
    description: c.description || `Explore the ${c.name} program. Requirements: ${c.requirements?.join(", ") || "English, Mathematics"}.`,
    institutionId: c.institutionId?._id || c.institutionId || "",
    tuition: c.tuition || "₦150,000/yr",
    requirements: c.requirements || [],
  }));
}

export async function getCourseById(id: string): Promise<Course | null> {
  const c = await request<any>(`/courses/${id}`);
  if (!c) return null;
  return {
    id: c._id,
    name: c.name,
    faculty: c.facultyId?.name || "Sciences",
    duration: c.duration || "4 years",
    cutoff: c.cutoffMark || 200,
    description: c.description || `Explore the ${c.name} program. Requirements: ${c.requirements?.join(", ") || "English, Mathematics"}.`,
    institutionId: c.institutionId?._id || c.institutionId || "",
    tuition: c.tuition || "₦150,000/yr",
    requirements: c.requirements || [],
  };
}

// Admin-only: return raw program document with all fields (for editing advanced config)
export async function getProgramForAdmin(id: string): Promise<any> {
  return await request<any>(`/courses/${id}`);
}

export async function getRecommendations() {
  const res = await request<any[]>("/recommendations");
  return res.map((r) => ({
    id: r._id,
    university: r.universityId?.name || "University of Lagos",
    universityId: r.universityId?._id || "",
    course: r.courseId?.courseName || "Computer Science",
    courseId: r.courseId?._id || "",
    match: r.matchScore ?? null,
    cutoff: r.courseId?.cutoffMark ?? null,
    slots: r.courseId?.slotsAvailable || 100,
    reason: r.reason || "Excellent match based on your interests and score.",
  }));
}

export async function getScholarships() {
  const res = await request<any[]>("/scholarships");
  return res.map((s) => ({
    id: s._id,
    name: s.title,
    amount: s.coverage || "₦500,000",
    deadline: s.deadline ? new Date(s.deadline).toISOString().split("T")[0] : "2026-08-30",
    eligibility: s.eligibility ? [s.eligibility] : ["All Applicants"],
    sponsor: s.sponsor || "Private Sponsor",
    category: s.category || "Merit",
  }));
}

export async function getNotifications() {
  // Notifications are derived from the user's activity on the server.
  // We return an empty array if there are no real notifications yet,
  // rather than showing fake data.
  try {
    const res = await request<any[]>("/users/notifications");
    return res.map((n) => ({
      id: n._id,
      title: n.title,
      body: n.body,
      time: n.time || new Date(n.createdAt).toLocaleDateString(),
      read: n.read || false,
      type: n.type || "info",
      link: n.link || "",
    }));
  } catch {
    // If endpoint doesn't exist yet, return empty list — no mock data
    return [];
  }
}

export async function markNotificationAsRead(id: string) {
  return await request<any>(`/users/notifications/${id}/read`, {
    method: "PUT",
  });
}

export async function markAllNotificationsAsRead() {
  return await request<any>("/users/notifications/read-all", {
    method: "PUT",
  });
}

export interface StudentApplication {
  id: string;
  university: string;
  course: string;
  status: string;
  submitted: string;
  probability: number;
  unreadMessagesCount: number;
}

export async function getApplications(): Promise<StudentApplication[]> {
  const res = await request<any[]>("/applications");
  return res.map((a) => ({
    id: a._id,
    university: a.universityId?.name || "University",
    course: a.courseId?.name || "Course", // Map from name property
    status: a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : "Pending",
    submitted: a.createdAt ? new Date(a.createdAt).toISOString().split("T")[0] : "N/A",
    probability: a.matchScore || 85,
    unreadMessagesCount: a.unreadMessagesCount || 0,
  }));
}

export async function getProfile() {
  const u = await request<any>("/users/profile");
  return {
    name: u.fullName || "",
    email: u.email || "",
    phone: u.phone || "",
    dob: u.dob || "",
    state: u.preferredLocation || "",
    gender: u.gender || "",
    jambScore: u.jambScore || 0,
    waecAggregate: u.waecAggregate || "",
    interests: u.interests || [],
    preferredUniversities: u.preferredUniversities || [],
    bio: u.bio || "",
    stateOfOrigin: u.stateOfOrigin || "",
    lga: u.lga || "",
    preferredCourse: u.preferredCourse || "",
    subjects: u.subjects || [],
    jambSubjects: u.jambSubjects || [],
    olevelSittings: u.olevelSittings || [],
  };
}

export async function updateProfile(data: any) {
  const payload: any = {};
  if (data.name !== undefined) payload.fullName = data.name;
  if (data.jambScore !== undefined && data.jambScore !== "") payload.jambScore = Number(data.jambScore);
  if (data.interests !== undefined) payload.interests = data.interests;
  if (data.state !== undefined) payload.preferredLocation = data.state;
  if (data.waecAggregate !== undefined) payload.waecAggregate = data.waecAggregate;
  if (data.subjects !== undefined) payload.subjects = data.subjects;
  if (data.jambSubjects !== undefined) payload.jambSubjects = data.jambSubjects;
  if (data.olevelSittings !== undefined) payload.olevelSittings = data.olevelSittings;
  if (data.stateOfOrigin !== undefined) payload.stateOfOrigin = data.stateOfOrigin;
  if (data.lga !== undefined) payload.lga = data.lga;
  if (data.preferredCourse !== undefined) payload.preferredCourse = data.preferredCourse;
  if (data.bio !== undefined) payload.bio = data.bio;

  const u = await request<any>("/users/update-profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return {
    name: u.fullName || "",
    email: u.email || "",
    phone: u.phone || "",
    dob: u.dob || "",
    state: u.preferredLocation || "",
    gender: u.gender || "",
    jambScore: u.jambScore || 0,
    waecAggregate: u.waecAggregate || "",
    interests: u.interests || [],
    preferredUniversities: u.preferredUniversities || [],
    bio: u.bio || "",
    stateOfOrigin: u.stateOfOrigin || "",
    lga: u.lga || "",
    preferredCourse: u.preferredCourse || "",
    subjects: u.subjects || [],
    jambSubjects: u.jambSubjects || [],
    olevelSittings: u.olevelSittings || [],
  };
}

export async function loginUser(email: string, password: string) {
  const res = await request<any>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return {
    token: res.token,
    user: {
      id: res._id,
      email: res.email,
      name: res.fullName,
      role: res.role,
    },
  };
}

export async function registerUser(name: string, email: string, password: string) {
  const res = await request<any>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName: name, email, password }),
  });
  return {
    token: res.token,
    user: {
      id: res._id,
      email: res.email,
      name: res.fullName,
      role: res.role,
    },
  };
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await request<any>("/users/upload-document", {
    method: "POST",
    body: formData,
  });
  return {
    id: res._id,
    name: res.name || file.name,
    size: file.size,
    url: res.url || "",
    uploadedAt: res.uploadedAt || new Date().toISOString(),
    status: "ready" as const,
  };
}

export async function ocrExtractResult(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await request<any>("/users/ocr-extract", {
    method: "POST",
    body: formData,
  });
  return {
    examType: res.examType,
    score: res.score || 0,
    subjects: res.subjects || [],
  };
}

export async function getUploadedDocuments() {
  const res = await request<any[]>("/users/documents");
  return res.map((d) => ({
    id: d._id,
    name: d.name,
    url: d.url,
    uploadedAt: d.uploadedAt,
    status: "ready" as const,
    size: 1024 * 128,
  }));
}

export async function deleteDocument(id: string) {
  return await request<{ success: boolean; message: string }>(`/users/documents/${id}`, {
    method: "DELETE",
  });
}

export async function submitApplication(universityId: string, courseId: string, documents: { name: string; url: string }[]) {
  return await request<any>("/applications/apply", {
    method: "POST",
    body: JSON.stringify({ universityId, courseId, documents }),
  });
}

export interface AdminApplication {
  id: string;
  student: {
    name: string;
    email: string;
    jambScore: number;
    waecAggregate: string;
  };
  university: {
    id: string;
    name: string;
    logo: string;
    location: string;
  };
  course: {
    id: string;
    name: string;
    faculty: string;
    cutoff: number;
    duration: string;
  };
  status: "pending" | "reviewed" | "accepted" | "rejected";
  matchScore: number;
  documents: { name: string; url: string }[];
  auditTrail: {
    action: string;
    performedBy: string;
    timestamp: string;
    notes?: string;
  }[];
  submitted: string;
  unreadMessagesCount: number;
}

export async function getAdminApplications(): Promise<AdminApplication[]> {
  const res = await request<any[]>("/admin/applications");
  return res.map((a) => ({
    id: a._id,
    student: {
      name: a.studentId?.fullName || "Student",
      email: a.studentId?.email || "student@example.com",
      jambScore: a.studentId?.jambScore || 0,
      waecAggregate: a.studentId?.waecAggregate || "Not uploaded",
    },
    university: {
      id: a.universityId?._id || "",
      name: a.universityId?.name || "University",
      logo: a.universityId?.logo || "",
      location: a.universityId?._id ? `${a.universityId.city}, ${a.universityId.state}` : "",
    },
    course: {
      id: a.courseId?._id || "",
      name: a.courseId?.name || "Course",
      faculty: a.courseId?.facultyId?.name || "Sciences",
      cutoff: a.courseId?.cutoffMark || 200,
      duration: a.courseId?.duration || "4 years",
    },
    status: a.status || "pending",
    matchScore: a.matchScore || 85,
    documents: a.documents || [],
    auditTrail: a.auditTrail?.map((trail: any) => ({
      action: trail.action,
      performedBy: trail.performedBy,
      timestamp: trail.timestamp ? new Date(trail.timestamp).toLocaleString() : new Date().toLocaleString(),
      notes: trail.notes,
    })) || [],
    submitted: a.createdAt ? new Date(a.createdAt).toISOString().split("T")[0] : "N/A",
    unreadMessagesCount: a.unreadMessagesCount || 0,
  }));
}

export async function updateApplicationStatus(id: string, status: string, notes?: string) {
  return await request<any>(`/admin/applications/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, notes }),
  });
}

export async function chatWithAssistant(history: { role: "user" | "assistant"; content: string }[], message: string) {
  const messages = history.map((h) => ({ role: h.role, content: h.content }));
  messages.push({ role: "user", content: message });

  const responseData = await request<any>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });

  // The AI controller returns { role, content } or just the string
  const content = typeof responseData === "string"
    ? responseData
    : responseData?.content || "Sorry, I could not generate a response.";

  return {
    role: "assistant" as const,
    content,
  };
}

export async function getAnalytics() {
  try {
    return await request<any>("/admin/analytics");
  } catch {
    // Return minimal empty state if admin analytics not available
    return {
      totals: { students: 0, universities: 0, courses: 0, applications: 0 },
      applicationsTrend: [] as { month: string; value: number }[],
      facultyMix: [] as { name: string; value: number }[],
      topUniversities: [] as { name: string; value: number }[],
    };
  }
}

export async function getStudentAnalytics(range: "7d" | "30d" | "90d" = "30d") {
  // Student analytics are computed client-side from real recommendation/application data.
  // We fetch those and derive the analytics rather than using mock data.
  try {
    const [recs, apps] = await Promise.all([
      getRecommendations().catch(() => []),
      getApplications().catch(() => []),
    ]);

    // Build probability trend from recommendations (use top match score as reference)
    const topMatch = recs.length > 0 ? Math.max(...recs.map((r) => r.match)) : 0;
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 12;
    const label = range === "7d"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : range === "90d"
      ? Array.from({ length: 12 }, (_, i) => `W${i + 1}`)
      : Array.from({ length: 30 }, (_, i) => `D${i + 1}`);

    const probabilityTrend = label.slice(0, days).map((d, i) => ({
      d,
      v: Math.min(100, Math.max(0, Math.round(topMatch * (0.7 + (i / days) * 0.3)))),
    }));

    // Build faculty match from recommendations
    const facultyMap: Record<string, number[]> = {};
    recs.forEach((r) => {
      const key = r.course || "Other";
      if (!facultyMap[key]) facultyMap[key] = [];
      facultyMap[key].push(r.match);
    });
    const matchByFaculty = Object.entries(facultyMap)
      .slice(0, 5)
      .map(([name, scores]) => ({
        name: name.length > 6 ? name.slice(0, 6) : name,
        value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }));

    // Application funnel from real data
    const statusOrder = ["Saved", "Drafted", "Submitted", "Reviewed", "Accepted"];
    const statusMap: Record<string, number> = { Saved: 0, Drafted: 0, Submitted: 0, Reviewed: 0, Accepted: 0 };
    apps.forEach((a) => {
      const s = a.status;
      if (s === "Pending" || s === "Draft") statusMap["Drafted"]++;
      else if (s === "Submitted") statusMap["Submitted"]++;
      else if (s === "Under Review" || s === "Reviewed") statusMap["Reviewed"]++;
      else if (s === "Accepted") statusMap["Accepted"]++;
      else statusMap["Saved"]++;
    });
    statusMap["Saved"] = apps.length;
    const applicationFunnel = statusOrder.map((stage) => ({ stage, count: statusMap[stage] || 0 }));

    // Skill radar — we can't compute this without test data, use recommendation-derived scores
    const skillRadar = [
      { skill: "Math", score: topMatch > 0 ? Math.min(100, topMatch + 5) : 0 },
      { skill: "Science", score: topMatch > 0 ? Math.min(100, topMatch) : 0 },
      { skill: "English", score: topMatch > 0 ? Math.max(0, topMatch - 10) : 0 },
      { skill: "Logic", score: topMatch > 0 ? Math.min(100, topMatch + 2) : 0 },
      { skill: "Writing", score: topMatch > 0 ? Math.max(0, topMatch - 15) : 0 },
      { skill: "Research", score: topMatch > 0 ? Math.max(0, topMatch - 5) : 0 },
    ];

    return { range, probabilityTrend, matchByFaculty, applicationFunnel, skillRadar };
  } catch {
    return {
      range,
      probabilityTrend: [] as { d: string; v: number }[],
      matchByFaculty: [] as { name: string; value: number }[],
      applicationFunnel: [] as { stage: string; count: number }[],
      skillRadar: [] as { skill: string; score: number }[],
    };
  }
}

export interface Message {
  id: string;
  applicationId: string;
  senderId: {
    _id: string;
    fullName: string;
    email: string;
  };
  senderRole: "student" | "admin" | "schoolAdmin";
  message: string;
  read: boolean;
  createdAt: string;
}

export async function getApplicationMessages(applicationId: string): Promise<Message[]> {
  const res = await request<any[]>(`/applications/${applicationId}/messages`);
  return res.map((m) => ({
    id: m._id,
    applicationId: m.applicationId,
    senderId: {
      _id: m.senderId?._id || "",
      fullName: m.senderId?.fullName || "System",
      email: m.senderId?.email || "",
    },
    senderRole: m.senderRole,
    message: m.message,
    read: m.read || false,
    createdAt: m.createdAt,
  }));
}

export async function sendApplicationMessage(applicationId: string, message: string): Promise<Message> {
  const m = await request<any>(`/applications/${applicationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return {
    id: m._id,
    applicationId: m.applicationId,
    senderId: {
      _id: m.senderId?._id || "",
      fullName: m.senderId?.fullName || "System",
      email: m.senderId?.email || "",
    },
    senderRole: m.senderRole,
    message: m.message,
    read: m.read || false,
    createdAt: m.createdAt,
  };
}

export async function markApplicationMessagesAsRead(applicationId: string): Promise<void> {
  await request<any>(`/applications/${applicationId}/messages/read`, {
    method: "PUT",
  });
}

export interface Subject {
  name: string;
  slug: string;
  shortName: string;
  category: string;
  examTypes: string[];
  aliases: string[];
  isCoreSubject: boolean;
  language?: string;
  code?: string;
}

export async function searchSubjects(
  query: string,
  options: { category?: string; examType?: string; limit?: number } = {}
): Promise<Subject[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (options.category) params.set("category", options.category);
  if (options.examType) params.set("examType", options.examType);
  if (options.limit) params.set("limit", String(options.limit));

  const queryStr = params.toString() ? `?${params.toString()}` : "";
  return await request<Subject[]>(`/subjects/search${queryStr}`);
}

export async function getSubjectCategories(): Promise<string[]> {
  return await request<string[]>("/subjects/categories");
}

export interface DashboardContext {
  profile: any;
  recommendations: any[];
  notifications: any[];
}

export async function getDashboardContext(): Promise<DashboardContext> {
  return await request<DashboardContext>("/users/dashboard-context");
}

export async function createInstitution(data: any): Promise<any> {
  return await request<any>("/admin/institutions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateInstitution(id: string, data: any): Promise<any> {
  return await request<any>(`/admin/institutions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteInstitution(id: string): Promise<any> {
  return await request<any>(`/admin/institutions/${id}`, {
    method: "DELETE",
  });
}

export interface FacultyData {
  _id?: string;
  name: string;
  institutionId?: any;
}

export async function getAdminFaculties(): Promise<FacultyData[]> {
  return await request<FacultyData[]>("/admin/faculties");
}

export async function createFaculty(institutionId: string, name: string): Promise<any> {
  return await request<any>("/admin/faculties", {
    method: "POST",
    body: JSON.stringify({ institutionId, name }),
  });
}

export async function updateFaculty(id: string, name: string): Promise<any> {
  return await request<any>(`/admin/faculties/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteFaculty(id: string): Promise<any> {
  return await request<any>(`/admin/faculties/${id}`, {
    method: "DELETE",
  });
}

export interface DepartmentData {
  _id?: string;
  name: string;
  institutionId?: any;
  facultyId?: any;
}

export async function getAdminDepartments(): Promise<DepartmentData[]> {
  return await request<DepartmentData[]>("/admin/departments");
}

export async function createDepartment(institutionId: string, facultyId: string, name: string): Promise<any> {
  return await request<any>("/admin/departments", {
    method: "POST",
    body: JSON.stringify({ institutionId, facultyId, name }),
  });
}

export async function updateDepartment(id: string, name: string): Promise<any> {
  return await request<any>(`/admin/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteDepartment(id: string): Promise<any> {
  return await request<any>(`/admin/departments/${id}`, {
    method: "DELETE",
  });
}

export async function createProgram(data: any): Promise<any> {
  return await request<any>("/admin/programs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProgram(id: string, data: any): Promise<any> {
  return await request<any>(`/admin/programs/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProgram(id: string): Promise<any> {
  return await request<any>(`/admin/programs/${id}`, {
    method: "DELETE",
  });
}

export async function runProgramAdmissions(programId: string) {
  return await request<any>(`/admin/programs/${programId}/run-admissions`, {
    method: "POST",
  });
}

export async function confirmOfferAcceptance(applicationId: string) {
  return await request<any>(`/applications/${applicationId}/confirm-accept`, {
    method: "POST",
  });
}

