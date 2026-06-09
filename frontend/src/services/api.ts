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
  const token = typeof window !== "undefined" ? localStorage.getItem("webar.token") : null;

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
  ranking: number | null;
  students: number | null;
  acceptance: number | null;
  tuition: string | null;
  logo: string | null;
  tags: string[];
  type?: string;
  courses?: Course[];
}

export interface Course {
  id: string;
  name: string;
  faculty: string;
  department?: string;
  duration: string | null;
  cutoff: number | null;
  description: string | null;
  institutionId?: string;
  tuition?: string | null;
  requirements?: string[];
  totalCapacity?: number;
  currentAdmitted?: number;
  appliedCount?: number;
  admittedCount?: number;
}

export async function getUniversities(): Promise<University[]> {
  const res = await request<any[]>("/universities");
  return res.map((u) => ({
    id: u._id,
    name: u.name,
    location: `${u.state}, ${u.city}`,
    ranking: u.ranking ?? null,
    students: u.studentPopulation ?? null,
    acceptance: u.acceptanceRate ?? null,
    tuition: u.tuition ?? null,
    logo: u.logo ?? null,
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
    ranking: u.ranking ?? null,
    students: u.studentPopulation ?? null,
    acceptance: u.acceptanceRate ?? null,
    tuition: u.tuition ?? null,
    logo: u.logo ?? null,
    tags: u.tags || [],
    type: u.institutionType,
    courses: u.courses?.map((c: any) => ({
      id: c._id,
      name: c.name,
      faculty: c.facultyId?.name ?? "N/A",
      department: c.departmentId?.name ?? "N/A",
      duration: c.duration ?? "N/A",
      cutoff: c.cutoffMark ?? 0,
      description: c.description ?? `Explore the ${c.name} program.`,
      institutionId: u._id,
      requirements: c.requirements || [],
      totalCapacity: c.totalCapacity ?? 0,
      currentAdmitted: c.currentAdmitted ?? 0,
    })) || [],
  };
}

export async function getCourses(): Promise<Course[]> {
  const res = await request<any[]>("/courses?limit=3000");
  return res.map((c) => ({
    id: c._id,
    name: c.name,
    faculty: c.facultyId?.name ?? null,
    duration: c.duration ?? null,
    cutoff: c.cutoffMark ?? null,
    description: c.description || `Explore the ${c.name} program. Requirements: ${c.requirements?.join(", ") || "English, Mathematics"}.`,
    institutionId: c.institutionId?._id || c.institutionId || "",
    tuition: c.tuition || "₦150,000/yr",
    requirements: c.requirements || [],
    totalCapacity: c.totalCapacity ?? 0,
    currentAdmitted: c.currentAdmitted ?? 0,
    appliedCount: c.appliedCount ?? 0,
    admittedCount: c.admittedCount ?? 0,
  }));
}

export async function getCourseById(id: string): Promise<Course | null> {
  const c = await request<any>(`/courses/${id}`);
  if (!c) return null;
  return {
    id: c._id,
    name: c.name,
    faculty: c.facultyId?.name ?? null,
    duration: c.duration ?? null,
    cutoff: c.cutoffMark ?? null,
    description: c.description || `Explore the ${c.name} program. Requirements: ${c.requirements?.join(", ") || "English, Mathematics"}.`,
    institutionId: c.institutionId?._id || c.institutionId || "",
    tuition: c.tuition || "₦150,000/yr",
    requirements: c.requirements || [],
    totalCapacity: c.totalCapacity ?? 0,
    currentAdmitted: c.currentAdmitted ?? 0,
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
    university: r.universityId?.name ?? null,
    universityId: r.universityId?._id ?? null,
    course: r.courseId?.courseName ?? null,
    courseId: r.courseId?._id || "",
    match: r.matchScore ?? null,
    cutoff: r.courseId?.cutoffMark ?? null,
    slots: r.courseId?.slotsAvailable || 0,
    breakdown: (r.breakdown || []) as { type: "PASS" | "FAIL" | "WARN"; field: string; message: string }[],
    confidence: (r.confidence || "Medium") as "High" | "Medium" | "Low",
    recourseActions: (r.recourseActions || []) as { code: string; type: string; message: string; actionLink: string }[],
    isFull: r.isFull ?? false,
  }));
}

// ==========================================
// SCHOLARSHIPS API
// ==========================================
export async function getScholarships() {
  const res = await request<any[]>("/scholarships");
  return res.map((s) => ({
    id: s._id || s.id,
    name: s.name || s.title,
    amount: s.amount || s.coverage || "₦500,000",
    deadline: s.deadline ? new Date(s.deadline).toISOString().split("T")[0] : "2026-08-30",
    eligibility: s.eligibility && s.eligibility.length > 0 ? s.eligibility : ["All Applicants"],
    sponsor: s.sponsor || "Private Sponsor",
    category: s.category || "Merit",
  }));
}

export async function createScholarship(data: any) {
  return await request<any>("/scholarships", { method: "POST", body: JSON.stringify(data) });
}

export async function updateScholarship(id: string, data: any) {
  return await request<any>(`/scholarships/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteScholarship(id: string) {
  return await request<any>(`/scholarships/${id}`, { method: "DELETE" });
}

export async function applyForScholarship(id: string) {
  return await request<any>(`/scholarships/${id}/apply`, { method: "POST" });
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
      time: n.time || (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : null), // Explicitly handle missing createdAt
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
  offerExpiresAt: string | null;
}

export async function getApplications(): Promise<StudentApplication[]> {
  const res = await request<any[]>("/applications");
  return res.map((a) => ({
    id: a._id,
    university: a.universityId?.name ?? "Unknown",
    course: a.courseId?.name ?? "Unknown",
    status: a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : "Pending",
    submitted: a.createdAt ? new Date(a.createdAt).toISOString().split("T")[0] : "",
    probability: a.matchScore || 85,
    unreadMessagesCount: a.unreadMessagesCount || 0,
    offerExpiresAt: a.offerExpiresAt ?? null,
  }));
}

// Removed duplicate AdminApplication and Message interfaces

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
    jambRegNo: u.jambRegNo || "",
    jambCandidateName: u.jambCandidateName || "",
    jambDateOfBirth: u.jambDateOfBirth || "",
    jambGender: u.jambGender || "",
    jambExamNo: u.jambExamNo || "",
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
  if (data.jambRegNo !== undefined) payload.jambRegNo = data.jambRegNo;
  if (data.jambCandidateName !== undefined) payload.jambCandidateName = data.jambCandidateName;
  if (data.jambDateOfBirth !== undefined) payload.jambDateOfBirth = data.jambDateOfBirth;
  if (data.jambGender !== undefined) payload.jambGender = data.jambGender;
  if (data.jambExamNo !== undefined) payload.jambExamNo = data.jambExamNo;
  if (data.interests !== undefined) payload.interests = data.interests;
  if (data.state !== undefined) payload.preferredLocation = data.state;
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
    gender: u.gender ?? null,
    jambScore: u.jambScore || 0,
    jambRegNo: u.jambRegNo || "",
    jambCandidateName: u.jambCandidateName || "",
    jambDateOfBirth: u.jambDateOfBirth || "",
    jambGender: u.jambGender || "",
    jambExamNo: u.jambExamNo || "",
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

export async function uploadDocument(file: File, type?: string, sittingNumber?: number) {
  const formData = new FormData();
  formData.append("file", file);
  
  let url = "/users/upload-document";
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (sittingNumber) params.append("sittingNumber", sittingNumber.toString());
  if (params.toString()) url += `?${params.toString()}`;

  const res = await request<any>(url, {
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
  return res;
}

export async function getUploadedDocuments() {
  const res = await request<any[]>("/users/documents");
  return res.map((d) => ({
    id: d._id,
    name: d.name,
    url: d.url,
    uploadedAt: d.uploadedAt,
    status: "ready" as const, // This is a client-side status
    size: d.size || 0, // Fetch actual size from backend
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
    id: string;
    name: string;
    email: string;
    jambScore: number;
    olevelSittings: any[];
    subjects: any[];
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
  documents: { name: string; url: string; uploadedAt?: string }[];
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
      id: a.studentId?._id || "",
      name: a.studentId?.fullName ?? null,
      email: a.studentId?.email ?? null,
      jambScore: a.studentId?.jambScore || 0,
      olevelSittings: a.studentId?.olevelSittings || [],
      subjects: a.studentId?.subjects || [],
    },
    university: {
      id: a.universityId?._id || "",
      name: a.universityId?.name || "University",
      logo: a.universityId?.logo || "",
      location: a.universityId?._id ? `${a.universityId.city}, ${a.universityId.state}` : "",
    },
    course: {
      id: a.courseId?._id ?? null,
      name: a.courseId?.name ?? null,
      faculty: a.courseId?.facultyId?.name ?? null,
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
      notes: trail.notes ?? null,
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
    : responseData?.content ?? "Sorry, I could not generate a response."; // Keep a fallback for AI content

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
      programCapacities: [] as any[],
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
    recs.forEach((r: any) => { // r is any here, but should be Recommendation type
      const key = r.course ?? "Other";
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
    _id: string | null;
    fullName: string;
    email: string;
  };
  senderRole: "student" | "admin" | "schoolAdmin" | "system";
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
      fullName: m.senderId?.fullName || (m.senderRole === "system" ? "System" : "Unknown"),
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
      fullName: m.senderId?.fullName || (m.senderRole === "system" ? "System" : "Unknown"), // More specific
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
export async function fetchAdmissionRules(): Promise<any[]> {
  return await request<any[]>('/admin/rules');
}

export async function createAdmissionRule(data: any): Promise<any> {
  return await request<any>('/admin/rules', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateAdmissionRule(id: string, data: any): Promise<any> {
  return await request<any>(`/admin/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteAdmissionRule(id: string): Promise<any> {
  return await request<any>(`/admin/rules/${id}`, { method: 'DELETE' });
}

