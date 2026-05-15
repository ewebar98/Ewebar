/**
 * Mock API service layer — backend-ready architecture.
 * Swap mock returns with real fetch/axios calls when Node/Express/MongoDB is wired.
 *
 * Convention: every service function mirrors a real REST endpoint:
 *   GET  /api/recommendations       -> getRecommendations()
 *   GET  /api/scholarships          -> getScholarships()
 *   GET  /api/universities          -> getUniversities()
 *   POST /api/auth/login            -> loginUser()
 */

import {
  mockUniversities,
  mockRecommendations,
  mockScholarships,
  mockNotifications,
  mockApplications,
  mockProfile,
  mockCourses,
  mockChatHistory,
  mockAnalytics,
} from "@/utils/mockData";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export async function getUniversities() {
  await delay();
  return mockUniversities;
}
export async function getUniversityById(id: string) {
  await delay();
  return mockUniversities.find((u) => u.id === id) ?? null;
}
export async function getCourses() {
  await delay();
  return mockCourses;
}
export async function getCourseById(id: string) {
  await delay();
  return mockCourses.find((c) => c.id === id) ?? null;
}
export async function getRecommendations() {
  await delay();
  return mockRecommendations;
}
export async function getScholarships() {
  await delay();
  return mockScholarships;
}
export async function getNotifications() {
  await delay();
  return mockNotifications;
}
export async function getApplications() {
  await delay();
  return mockApplications;
}
export async function getProfile() {
  await delay();
  return mockProfile;
}
export async function updateProfile(data: Partial<typeof mockProfile>) {
  await delay();
  return { ...mockProfile, ...data };
}
export async function loginUser(email: string, _password: string) {
  await delay();
  return { token: "mock-token", user: { id: "u_1", email, name: "Ada Student" } };
}
export async function registerUser(name: string, email: string, _password: string) {
  await delay();
  return { token: "mock-token", user: { id: "u_new", email, name } };
}
export async function uploadDocument(file: File) {
  await delay(800);
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    status: "ready" as const,
  };
}
export async function ocrExtractResult(file: File) {
  await delay(1200);
  return {
    examType: file.name.toLowerCase().includes("waec") ? "WAEC" : "JAMB",
    score: 268,
    subjects: [
      { name: "Mathematics", grade: "A1" },
      { name: "English", grade: "B2" },
      { name: "Physics", grade: "A1" },
      { name: "Chemistry", grade: "B3" },
      { name: "Biology", grade: "B2" },
    ],
  };
}
export async function chatWithAssistant(_history: { role: string; content: string }[], message: string) {
  await delay(700);
  return {
    role: "assistant" as const,
    content: `Great question — based on your profile, ${message.slice(0, 40)}... Here's a focused suggestion: explore the Recommendations page where I've matched you to 3 strong-fit programs.`,
  };
}
export async function getChatHistory() {
  await delay();
  return mockChatHistory;
}
export async function getAnalytics() {
  await delay();
  return mockAnalytics;
}
export async function getStudentAnalytics(range: "7d" | "30d" | "90d" = "30d") {
  await delay(450);
  const { mockStudentAnalytics } = await import("@/utils/mockData");
  return {
    range,
    probabilityTrend: mockStudentAnalytics.probabilityTrend[range],
    matchByFaculty: mockStudentAnalytics.matchByFaculty,
    applicationFunnel: mockStudentAnalytics.applicationFunnel,
    skillRadar: mockStudentAnalytics.skillRadar,
  };
}
