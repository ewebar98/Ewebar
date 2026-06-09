import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  X,
  Loader2,
  ScanLine,
  Eye,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Info,
  BookOpen,
  ShieldAlert,
  ArrowRight,
  GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/layouts/AppLayout";
import { PageHeader, Badge, EmptyState } from "@/components/ui-kit";
import {
  uploadDocument,
  ocrExtractResult,
  getUploadedDocuments,
  deleteDocument,
  getProfile,
  updateProfile,
  getUniversities,
  getUniversityById,
  Subject,
  BACKEND_URL
} from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { SearchableSubjectSelect } from "@/components/SearchableSubjectSelect";
import { useQueryClient } from "@tanstack/react-query";
import { NIGERIAN_STATES, STATE_LGA_MAPPING } from "@/constants/nigerianStatesLgas"; // Keep this import

const DocumentsRouteComponent = () => (
  <AppLayout>
    <Documents />
  </AppLayout>
);

export const Route = createFileRoute("/documents")({
  beforeLoad: requireRole("student"),
  head: () => ({ meta: [{ title: "Academic Locker | WeBAR" }] }),
  component: DocumentsRouteComponent,
});

interface OLevelSubject {
  name: string;
  grade: string;
}

interface OLevelSitting {
  resultSlip?: {
    _id: string;
    name: string;
    url: string;
  };
  sittingNumber: number;
  examType: string;
  examYear: string;
  sittingType: string;
  candidateFullName: string;
  dateOfBirth: string;
  gender: string;
  examNumber: string;
  schoolNumber: string;
  serialNumber?: string;
  pin?: string;
  stateOfOrigin?: string;
  lga?: string;
  subjects: OLevelSubject[];
}

interface JambSubject {
  name: string;
  score: number;
}

type Doc = {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "ocr" | "ready" | "error";
  progress: number;
  url?: string;
};

const OLEVEL_GRADES = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"];

const createDefaultSitting = (num: number): OLevelSitting => ({
  sittingNumber: num,
  examType: "WAEC",
  examYear: new Date().getFullYear().toString(),
  sittingType: "May/June",
  candidateFullName: "",
  dateOfBirth: "",
  gender: "Male",
  examNumber: "",
  schoolNumber: "",
  serialNumber: "",
  pin: "",
  stateOfOrigin: "",
  lga: "",
  subjects: [
    { name: "English Language", grade: "C6" },
    { name: "Mathematics", grade: "C6" },
  ],
});

// Numeric rating for grade comparison (lower is better, e.g. A1 = 1, F9 = 9)
const GRADE_RANKS: Record<string, number> = {
  A1: 1, B2: 2, B3: 3, C4: 4, C5: 5, C6: 6, D7: 7, E8: 8, F9: 9
};

function Documents() {
  const queryClient = useQueryClient();
  // Tabs: "verification" | "locker"
  const [jambResultSlip, setJambResultSlip] = useState<any>(null);
  const [isJambUploading, setIsJambUploading] = useState(false);
  const [isOlevelUploading, setIsOlevelUploading] = useState<Record<number, boolean>>({});

  // Api Hooks
  const { data: profile, loading: profileLoading, refresh: refreshProfile } = useApi("getProfile", getProfile);
  const { data: backendDocs, loading: docsLoading, refresh: refreshDocs } = useApi("getUploadedDocuments", getUploadedDocuments);

  // Form State
  const [olevelSittings, setOlevelSittings] = useState<OLevelSitting[]>([createDefaultSitting(1)]);
  const [sittingCount, setSittingCount] = useState<1 | 2>(1);
  const [jambScore, setJambScore] = useState<number>(0);
  const [jambRegNo, setJambRegNo] = useState<string>("");
  const [jambCandidateName, setJambCandidateName] = useState<string>("");
  const [jambDateOfBirth, setJambDateOfBirth] = useState<string>("");
  const [jambGender, setJambGender] = useState<string>("Male");
  const [jambExamNo, setJambExamNo] = useState<string>("");
  const [jambSubjects, setJambSubjects] = useState<JambSubject[]>([
    { name: "Use of English", score: 0 },
    { name: "", score: 0 },
    { name: "", score: 0 },
    { name: "", score: 0 },
  ]);

  const [stateOfOrigin, setStateOfOrigin] = useState<string>("");
  const [lga, setLga] = useState<string>("");
  const [preferredCourse, setPreferredCourse] = useState<string>("");

  // Fetch LASUSTECH courses dynamically for preferred course dropdown
  const { data: schools } = useApi("getUniversities", getUniversities);
  const lasustechUni = schools?.find(
    (u) => u.name.includes("Lagos State University of Science") || u.name.includes("LASUSTECH")
  );

  const { data: lasustechData } = useApi(
    "getLasustech",
    () => (lasustechUni ? getUniversityById(lasustechUni.id) : Promise.resolve(null)),
    [lasustechUni?.id]
  );

  const lasustechCourses = (lasustechData as any)?.courses || [];
  const courseOptions = Array.from(new Set(lasustechCourses.map((c: any) => c.name))).sort() as string[];

  // Upload/OCR status list
  const [docs, setDocs] = useState<Doc[]>([]);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<Doc | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document permanently?")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteDocument(id);
      toast.success("Document deleted successfully");
      refreshDocs();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  const initializedRef = useRef(false);

  // Sync profile details to state on load (only once)
  useEffect(() => {
    if (profile && !initializedRef.current) {
      if (profile.olevelSittings && profile.olevelSittings.length > 0) {
        setOlevelSittings(profile.olevelSittings);
        setSittingCount(profile.olevelSittings.length === 2 ? 2 : 1);
      } else {
        setOlevelSittings([createDefaultSitting(1)]);
        setSittingCount(1);
      }

      if ((profile as any).jambResultSlip) {
        setJambResultSlip((profile as any).jambResultSlip);
      }
      if (profile.jambScore !== undefined) {
        setJambScore(profile.jambScore);
      }

      if (profile.jambRegNo !== undefined) {
        setJambRegNo(profile.jambRegNo);
      }
      if ((profile as any).jambCandidateName !== undefined) {
        setJambCandidateName((profile as any).jambCandidateName);
      }
      if ((profile as any).jambDateOfBirth !== undefined) {
        setJambDateOfBirth((profile as any).jambDateOfBirth);
      }
      if ((profile as any).jambGender !== undefined) {
        setJambGender((profile as any).jambGender || "Male");
      }
      if ((profile as any).jambExamNo !== undefined) {
        setJambExamNo((profile as any).jambExamNo);
      }

      if (profile.jambSubjects && profile.jambSubjects.length === 4) {
        setJambSubjects(profile.jambSubjects);
      } else {
        setJambSubjects([
          { name: "Use of English", score: 0 },
          { name: "", score: 0 },
          { name: "", score: 0 },
          { name: "", score: 0 },
        ]);
      }

      if (profile.stateOfOrigin !== undefined) {
        setStateOfOrigin(profile.stateOfOrigin);
      }
      if (profile.lga !== undefined) {
        setLga(profile.lga);
      }
      if (profile.preferredCourse !== undefined) {
        setPreferredCourse(profile.preferredCourse);
      }
      initializedRef.current = true;
    }
  }, [profile]);

  // Toggle O'Level sittings count
  const handleSittingCountChange = (count: 1 | 2) => {
    setSittingCount(count);
    if (count === 2 && olevelSittings.length === 1) {
      setOlevelSittings([...olevelSittings, createDefaultSitting(2)]);
    } else if (count === 1 && olevelSittings.length === 2) {
      setOlevelSittings([olevelSittings[0]]);
    }
  };

  // Modify sitting metadata
  const handleSittingFieldChange = (index: number, field: keyof OLevelSitting, value: any) => {
    setOlevelSittings((prev) => {
      const updated = [...prev];
      let updatedSitting = { ...updated[index], [field]: value };
      
      // Auto-set sittingType based on examType
      if (field === "examType") {
        if (value === "WAEC" || value === "NABTEB") {
          updatedSitting.sittingType = "May/June";
        } else if (value === "NECO") {
          updatedSitting.sittingType = "June/July";
        } else if (value === "GCE") {
          updatedSitting.sittingType = "Nov/Dec";
        }
      }
      
      updated[index] = updatedSitting;
      return updated;
    });
  };

  const handleSittingFieldsChange = (index: number, fields: Partial<OLevelSitting>) => {
    setOlevelSittings((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...fields };
      return updated;
    });
  };

  // Subject actions in O'Level sitting
  const handleAddSubject = (sittingIndex: number) => {
    setOlevelSittings((prev) => {
      const updated = [...prev];
      const sittingCopy = { ...updated[sittingIndex] };
      sittingCopy.subjects = [...sittingCopy.subjects, { name: "", grade: "C6" }];
      updated[sittingIndex] = sittingCopy;
      return updated;
    });
  };

  const handleRemoveSubject = (sittingIndex: number, subjectIndex: number) => {
    setOlevelSittings((prev) => {
      const updated = [...prev];
      const sittingCopy = { ...updated[sittingIndex] };
      const subCopy = [...sittingCopy.subjects];
      subCopy.splice(subjectIndex, 1);
      sittingCopy.subjects = subCopy;
      updated[sittingIndex] = sittingCopy;
      return updated;
    });
  };

  const handleSubjectChange = (sittingIndex: number, subjectIndex: number, subjectName: string) => {
    setOlevelSittings((prev) => {
      const updated = [...prev];
      const sittingCopy = { ...updated[sittingIndex] };
      const subCopy = [...sittingCopy.subjects];
      subCopy[subjectIndex] = { ...subCopy[subjectIndex], name: subjectName };
      sittingCopy.subjects = subCopy;
      updated[sittingIndex] = sittingCopy;
      return updated;
    });
  };

  const handleGradeChange = (sittingIndex: number, subjectIndex: number, grade: string) => {
    setOlevelSittings((prev) => {
      const updated = [...prev];
      const sittingCopy = { ...updated[sittingIndex] };
      const subCopy = [...sittingCopy.subjects];
      subCopy[subjectIndex] = { ...subCopy[subjectIndex], grade };
      sittingCopy.subjects = subCopy;
      updated[sittingIndex] = sittingCopy;
      return updated;
    });
  };


  // JAMB Subject changes
  const handleJambSubjectChange = (index: number, value: string) => {
    const updated = [...jambSubjects];
    updated[index] = { ...updated[index], name: value };
    setJambSubjects(updated);
  };

  const handleJambScoreChange = (index: number, score: number) => {
    const updated = [...jambSubjects];
    updated[index] = { ...updated[index], score };
    setJambSubjects(updated);
  };

  // OCR Auto populate script
  const handleOcrPopulate = (ocrData: any, type: string, sittingNumber?: number) => {
    if (type === "jamb" || ocrData.examType === "JAMB") {
      setJambScore(ocrData.score || 250);
      if (ocrData.jambRegNo) {
        setJambRegNo(ocrData.jambRegNo);
      }
      if (ocrData.candidateFullName) {
        setJambCandidateName(ocrData.candidateFullName);
      }
      if (ocrData.dateOfBirth) {
        setJambDateOfBirth(ocrData.dateOfBirth);
      }
      if (ocrData.gender) {
        setJambGender(ocrData.gender);
      }
      if (ocrData.examNumber) {
        setJambExamNo(ocrData.examNumber);
      }
      if (ocrData.stateOfOrigin) {
        const foundState = NIGERIAN_STATES.find(s => ocrData.stateOfOrigin.toLowerCase().includes(s.toLowerCase()));
        if (foundState) {
          setStateOfOrigin(foundState);
        }
      }
      const subjectsMap: JambSubject[] = [
        { name: "Use of English", score: 0 },
        { name: "", score: 0 },
        { name: "", score: 0 },
        { name: "", score: 0 },
      ];
      ocrData.subjects?.forEach((sub: any, idx: number) => {
        const scoreVal = parseInt(sub.grade) || 0;
        if (sub.name.toLowerCase() === "use of english" || sub.name.toLowerCase() === "english" || idx === 0) {
          subjectsMap[0] = { name: "Use of English", score: scoreVal };
        } else if (idx < 4) {
          subjectsMap[idx] = { name: sub.name, score: scoreVal };
        }
      });
      // Fallback names if missing
      for (let i = 1; i < 4; i++) {
        if (!subjectsMap[i].name) subjectsMap[i].name = "Mathematics";
      }
      setJambSubjects(subjectsMap);
      toast.success("JAMB metrics auto-populated! Review details in JAMB section.");
    } else {
      // O'Level Sittings
      const activeSittingIdx = sittingNumber ? sittingNumber - 1 : (olevelSittings.length === 2 && olevelSittings[0].examNumber ? 1 : 0);
      if (activeSittingIdx === 1) {
        setSittingCount(2);
      }

      const updated = [...olevelSittings];
      if (updated.length <= activeSittingIdx) {
        updated.push(createDefaultSitting(activeSittingIdx + 1));
      }

      const rawSubArr = ocrData.subjects || [];
      const formattedSubjects: OLevelSubject[] = rawSubArr.map((s: any) => ({
        name: s.name,
        grade: OLEVEL_GRADES.includes(s.grade) ? s.grade : "C6"
      }));

      updated[activeSittingIdx] = {
        sittingNumber: activeSittingIdx + 1,
        examType: ocrData.examType || "WAEC",
        examYear: ocrData.examYear || new Date().getFullYear().toString(),
        sittingType: ocrData.sittingType || "May/June",
        candidateFullName: ocrData.candidateFullName || "",
        dateOfBirth: ocrData.dateOfBirth || "",
        gender: ocrData.gender || "Male",
        examNumber: ocrData.examNumber || "",
        schoolNumber: ocrData.schoolNumber || "",
        serialNumber: ocrData.serialNumber || "",
        pin: ocrData.pin || "",
        stateOfOrigin: "",
        lga: "",
        subjects: formattedSubjects.length > 0 ? formattedSubjects : [
          { name: "English Language", grade: "C6" },
          { name: "Mathematics", grade: "C6" },
        ],
      };

      setOlevelSittings(updated);
      toast.success(`OCR Extracted! ${ocrData.examType} details loaded into Sitting #${activeSittingIdx + 1}.`);
    }
  };

  const handleSingleUpload = async (file: File, type: "jamb" | "olevel", sittingNumber?: number) => {
    if (type === "jamb") setIsJambUploading(true);
    else if (type === "olevel" && sittingNumber) setIsOlevelUploading(prev => ({ ...prev, [sittingNumber]: true }));

    try {
      const uploaded = await uploadDocument(file, type, sittingNumber);
      const ocr = await ocrExtractResult(file);
      handleOcrPopulate(ocr, type, sittingNumber);
      refreshProfile();
      toast.success("Document uploaded and processed successfully!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message || "Unknown error"}`);
    } finally {
      if (type === "jamb") setIsJambUploading(false);
      else if (type === "olevel" && sittingNumber) setIsOlevelUploading(prev => ({ ...prev, [sittingNumber]: false }));
    }
  };

  // File Upload flow
  const handleFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      const newDoc: Doc = { id, name: file.name, size: file.size, status: "uploading", progress: 0 };
      setDocs((d) => [newDoc, ...d]);

      // upload animation increment
      for (let p = 10; p <= 90; p += 20) {
        await new Promise((r) => setTimeout(r, 100));
        setDocs((d) => d.map((x) => (x.id === id ? { ...x, progress: p } : x)));
      }

      try {
        const uploaded = await uploadDocument(file);
        setDocs((d) => d.map((x) => (x.id === id ? { ...x, status: "ocr", progress: 100, url: uploaded.url } : x)));

        // Trigger OCR extraction
        const ocr = await ocrExtractResult(file); // This is where the mock data comes from
        setDocs((d) => d.map((x) => (x.id === id ? { ...x, status: "ready" } : x)));
        refreshDocs();

        // Feed to state
        handleOcrPopulate(ocr);
        setActiveTab("verification");
      } catch (err: any) {
        setDocs((d) => d.map((x) => (x.id === id ? { ...x, status: "error", progress: 100 } : x))); // Ensure progress is 100 on error
        toast.error(`Processing failed: ${err.message || "Unknown error"}`);
      }
    }
  };

  // COMBINE AND VERIFY O'LEVEL CRITERIA
  const combinedOLevelInfo = useMemo(() => {
    const combined: Record<string, string> = {};
    olevelSittings.forEach((sit) => {
      sit.subjects.forEach((sub) => {
        if (!sub.name) return;
        const currentGrade = sub.grade;
        const existingGrade = combined[sub.name];
        if (!existingGrade) {
          combined[sub.name] = currentGrade;
        } else {
          // Keep the better grade (lower rank)
          const currentRank = GRADE_RANKS[currentGrade] || 9;
          const existingRank = GRADE_RANKS[existingGrade] || 9;
          if (currentRank < existingRank) {
            combined[sub.name] = currentGrade;
          }
        }
      });
    });

    const uniqueSubjects = Object.entries(combined).map(([name, grade]) => ({ name, grade }));
    const passes = uniqueSubjects.filter((s) => {
      const rank = GRADE_RANKS[s.grade] || 9;
      return rank <= 6; // A1-C6 represent credit passes
    });

    const mathPassObj = uniqueSubjects.find((s) => 
      s.name.toLowerCase() === "mathematics" || s.name.toLowerCase() === "general mathematics"
    );
    const mathRank = mathPassObj ? GRADE_RANKS[mathPassObj.grade] || 9 : 9;
    const hasMathCredit = mathRank <= 6;

    const engPassObj = uniqueSubjects.find((s) => 
      s.name.toLowerCase() === "english language" || s.name.toLowerCase() === "english"
    );
    const engRank = engPassObj ? GRADE_RANKS[engPassObj.grade] || 9 : 9;
    const hasEngCredit = engRank <= 6;

    const civicPassObj = uniqueSubjects.find((s) => 
      s.name.toLowerCase() === "civic education" || s.name.toLowerCase() === "civics" || s.name.toLowerCase() === "citizenship and heritage studies"
    );
    const civicRank = civicPassObj ? GRADE_RANKS[civicPassObj.grade] || 9 : 9;
    const hasCivicCredit = civicRank <= 6;

    const meetsCore = hasMathCredit && hasEngCredit && hasCivicCredit && passes.length >= 5;

    // WAEC 2026 Subject Combinations Validation:
    const hasEconomics = uniqueSubjects.some((s) => s.name.toLowerCase() === "economics");
    const hasScienceElectives = uniqueSubjects.some((s) => 
      ["physics", "chemistry", "biology"].includes(s.name.toLowerCase())
    );
    const hasArtElectives = uniqueSubjects.some((s) => 
      ["literature-in-english", "literature in english", "literature", "government", "history", "christian religious studies", "islamic religious studies", "fine arts"].includes(s.name.toLowerCase())
    );
    
    // WAEC 2026 Rule: Science and Art streams are barred from registering Economics.
    const isEconomicsViolated = hasEconomics && (hasScienceElectives || hasArtElectives);

    const missingCoreSubjects: string[] = [];
    const hasEng = uniqueSubjects.some((s) => ["english language", "english"].includes(s.name.toLowerCase()));
    const hasMath = uniqueSubjects.some((s) => ["general mathematics", "mathematics"].includes(s.name.toLowerCase()));
    const hasCivic = uniqueSubjects.some((s) => ["civic education", "civics", "citizenship and heritage studies"].includes(s.name.toLowerCase()));
    
    if (!hasEng) missingCoreSubjects.push("English Language");
    if (!hasMath) missingCoreSubjects.push("General Mathematics");
    if (!hasCivic) missingCoreSubjects.push("Civic Education");

    return {
      uniqueSubjects,
      passesCount: passes.length,
      hasMathCredit,
      hasEngCredit,
      hasCivicCredit,
      meetsCore,
      mathGrade: mathPassObj?.grade || "N/A",
      engGrade: engPassObj?.grade || "N/A",
      civicGrade: civicPassObj?.grade || "N/A",
      isEconomicsViolated,
      missingCoreSubjects,
    };
  }, [olevelSittings]);

  // JAMB VALIDATION & ADVISORY
  const jambAdvisory = useMemo(() => {
    const sumOfSubjects = jambSubjects.reduce((acc, sub) => acc + (sub.score || 0), 0);
    const scoreMismatch = sumOfSubjects !== jambScore;

    const selectedNames = jambSubjects.map((s) => s.name.toLowerCase().trim()).filter(Boolean);
    const hasMath = selectedNames.includes("mathematics");
    const hasPhysics = selectedNames.includes("physics");
    const hasChemistry = selectedNames.includes("chemistry");
    const hasBiology = selectedNames.includes("biology");
    const hasEconomics = selectedNames.includes("economics");
    const hasGovernment = selectedNames.includes("government");
    const hasLiterature = selectedNames.includes("literature in english") || selectedNames.includes("literature");

    let pathway = "Custom / Unspecified Pathway";
    let recommendations = "Select distinct subjects to receive matching advice.";
    let isValidCombination = true;

    if (hasMath && hasPhysics && hasChemistry) {
      pathway = "Engineering & Physical Sciences";
      recommendations = "Excellent. Perfectly aligned for Computer Science, Electrical Engineering, Mechanical Engineering, and Physics courses.";
    } else if (hasBiology && hasChemistry && hasPhysics) {
      pathway = "Medical, Pharmaceutical & Biological Sciences";
      recommendations = "Ideal combination. Highly eligible for Medicine & Surgery, Pharmacy, Nursing, Biochemistry, and Dentistry.";
    } else if (hasEconomics && hasMath && (hasGovernment || selectedNames.includes("accounting") || selectedNames.includes("commerce"))) {
      pathway = "Commercial & Social Sciences";
      recommendations = "Great combination! Eligible for Economics, Accounting, Finance, Business Administration, and Public Administration.";
    } else if (hasLiterature && hasGovernment) {
      pathway = "Arts & Humanities";
      recommendations = "Fantastic. Strongly qualified for Law, English Literature, Mass Communication, International Relations, and Theatre Arts.";
    } else if (selectedNames.length >= 4) {
      isValidCombination = false;
      pathway = "Mixed Pathway Combination";
      recommendations = "Ensure your selected combination matches the precise prerequisite guide of your target course.";
    }

    return {
      sumOfSubjects,
      scoreMismatch,
      pathway,
      recommendations,
      isValidCombination,
    };
  }, [jambScore, jambSubjects]);

  // SAVE TO DATABASE
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Basic client-side validation
      if (jambScore > 400 || jambScore < 0) {
        throw new Error("JAMB score must be between 0 and 400");
      }
      if (jambAdvisory.scoreMismatch && jambScore > 0) {
        toast.warning("Warning: The sum of your JAMB subject scores does not match your total JAMB score.");
      }
      
      if (!combinedOLevelInfo.meetsCore) {
        throw new Error("You do not meet the core O'Level prerequisites (English, Maths, and Civic Education credits).");
      }

      if (combinedOLevelInfo.isEconomicsViolated) {
        throw new Error("Invalid O'Level subject combination detected for WAEC 2026 regulations.");
      }

      // Check O'level metadata
      for (const sit of olevelSittings) {
        if (!sit.examNumber && (sit.subjects.length > 0 && sit.subjects[0].name !== "English Language")) {
          throw new Error(`Sitting #${sit.sittingNumber} lacks an Exam Number.`);
        }
      }

      if (jambRegNo && !/^(19|20)\d{2}\d{4,8}[A-Z]{2}$/i.test(jambRegNo)) {
        throw new Error("JAMB Registration Number must start with a 4-digit registration year, followed by 4 to 8 digits, and end with 2 letters (e.g. 20261234AB or 202330639047FF)");
      }

      await updateProfile({
        jambScore,
        jambRegNo,
        jambCandidateName,
        jambDateOfBirth,
        jambGender,
        jambExamNo,
        jambSubjects: jambSubjects.filter((s) => s.name),
        olevelSittings,
        subjects: combinedOLevelInfo.uniqueSubjects,
        stateOfOrigin,
        lga,
        preferredCourse,
      });

      // Invalidate React Query cached queries for immediate reactive updates on other pages
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-context"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });

      toast.success("Academic verification records synchronized with your profile!");
      refreshProfile();
    } catch (err: any) {
      toast.error(`Verification save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Academic Locker & Verification"
          subtitle="Keep your exam certificates securely synced and verified for direct university admissions."
        />
        
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Entry Panel */}
          <div className="space-y-6 lg:col-span-2">
            {/* O'LEVEL PANEL */}
            <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full blur-3xl -z-10" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">O'Level Academic Record</h3>
                  <p className="text-xs text-muted-foreground">Provide WAEC, NECO, NABTEB or GCE details below.</p>
                </div>
                <div className="flex bg-muted/60 p-1 rounded-xl items-center self-start">
                  <button
                    type="button"
                    onClick={() => handleSittingCountChange(1)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      sittingCount === 1 ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    One Sitting
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSittingCountChange(2)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      sittingCount === 2 ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Two Sittings
                  </button>
                </div>
              </div>

              {olevelSittings.map((sitting, sIdx) => (
                <div key={sIdx} className="space-y-4 border-b border-dashed pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <Badge tone="primary">Sitting #{sIdx + 1}</Badge>
                    {olevelSittings.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive gap-1 px-2 py-1 h-auto"
                        onClick={() => {
                          const updated = olevelSittings.filter((_, i) => i !== sIdx);
                          // Reassign sitting numbers
                          const reassigned = updated.map((s, i) => ({ ...s, sittingNumber: i + 1 }));
                          setOlevelSittings(reassigned);
                          setSittingCount(reassigned.length as 1 | 2);
                          toast.info(`Sitting #${sIdx + 1} cleared.`);
                        }}
                      >
                        <Trash2 className="h-3 w-3" /> Clear Sitting
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4 bg-muted/20 p-4 rounded-2xl border border-dashed border-primary/20">
                    <div className="flex items-center gap-3">
                      {sitting.resultSlip ? (
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">Document Uploaded</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{sitting.resultSlip.name}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Upload className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">Upload Result Slip</p>
                            <p className="text-[10px] text-muted-foreground">Auto-fills the form below</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      {sitting.resultSlip ? (
                         <div className="flex items-center gap-2">
                           <a href={`${BACKEND_URL}${sitting.resultSlip.url}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">View</a>
                           <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteDocument(sitting.resultSlip!._id)}>
                             {deletingId === sitting.resultSlip._id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="h-3 w-3" />}
                           </Button>
                         </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleSingleUpload(e.target.files[0], 'olevel', sIdx + 1);
                            }
                          }} disabled={isOlevelUploading[sIdx + 1]} />
                          <Button asChild size="sm" className="bg-gradient-primary rounded-xl text-xs h-8" disabled={isOlevelUploading[sIdx + 1]}>
                            <span>{isOlevelUploading[sIdx + 1] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Select File'}</span>
                          </Button>
                        </label>
                      )}
                    </div>
                  </div>
                  {/* Demographics / Details Grid */}
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Exam Board</label>
                      <select
                        value={sitting.examType}
                        onChange={(e) => handleSittingFieldChange(sIdx, "examType", e.target.value)}
                        className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                      >
                        <option value="WAEC">WAEC</option>
                        <option value="NECO">NECO</option>
                        <option value="NABTEB">NABTEB</option>
                        <option value="GCE">GCE</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Exam Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 2026"
                        value={sitting.examYear}
                        onChange={(e) => handleSittingFieldChange(sIdx, "examYear", e.target.value)}
                        className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sitting Type</label>
                      <select
                        value={sitting.sittingType}
                        onChange={(e) => handleSittingFieldChange(sIdx, "sittingType", e.target.value)}
                        className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                      >
                        <option value="May/June">May/June (School Candidate)</option>
                        <option value="June/July">June/July (NECO School)</option>
                        <option value="Nov/Dec">Nov/Dec (Private GCE)</option>
                        <option value="Internal">Internal</option>
                        <option value="External">External</option>
                      </select>
                    </div>

                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Candidate Full Name</label>
                      <input
                        type="text"
                        placeholder="Matches certificate exactly"
                        value={sitting.candidateFullName}
                        onChange={(e) => handleSittingFieldChange(sIdx, "candidateFullName", e.target.value)}
                        className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</label>
                      <input
                        type="date"
                        value={sitting.dateOfBirth}
                        onChange={(e) => handleSittingFieldChange(sIdx, "dateOfBirth", e.target.value)}
                        className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gender</label>
                      <select
                        value={sitting.gender}
                        onChange={(e) => handleSittingFieldChange(sIdx, "gender", e.target.value)}
                        className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  {/* Verification Credentials Row */}
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4 bg-muted/30 p-3 rounded-2xl border">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Exam Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 4201029012"
                        value={sitting.examNumber}
                        onChange={(e) => handleSittingFieldChange(sIdx, "examNumber", e.target.value)}
                        className="w-full rounded-xl border bg-background px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">School Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 42010"
                        value={sitting.schoolNumber}
                        onChange={(e) => handleSittingFieldChange(sIdx, "schoolNumber", e.target.value)}
                        className="w-full rounded-xl border bg-background px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">State of Origin</label>
                      <select
                        className="w-full rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        value={sitting.stateOfOrigin || ""}
                        onChange={(e) => {
                          handleSittingFieldsChange(sIdx, { stateOfOrigin: e.target.value, lga: "" });
                        }}
                      >
                        <option value="">Select State</option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">LGA of Origin</label>
                      {sitting.stateOfOrigin ? (
                        <select
                          className="w-full rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          value={sitting.lga || ""}
                          onChange={(e) => handleSittingFieldChange(sIdx, "lga", e.target.value)}
                        >
                          <option value="">Select LGA</option>
                          {(STATE_LGA_MAPPING[sitting.stateOfOrigin] || []).map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          className="w-full rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          value=""
                          disabled
                        >
                          <option value="">Select state first</option>
                        </select>
                      )}
                    </div>

                  </div>

                  {/* Subject Grade Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                      <span>Subject Passes</span>
                      <span>Grade</span>
                    </div>
                    <div className="space-y-2">
                      {sitting.subjects.map((subject, subIdx) => (
                        <div key={subIdx} className="flex items-center gap-2">
                          <SearchableSubjectSelect
                            value={subject.name}
                            onChange={(name) => handleSubjectChange(sIdx, subIdx, name)}
                            examType={sitting.examType}
                            excludeList={sitting.subjects.map((s) => s.name)}
                            placeholder="Type or select subject..."
                            className="flex-1"
                          />
                          <select
                            value={subject.grade}
                            onChange={(e) => handleGradeChange(sIdx, subIdx, e.target.value)}
                            className="w-20 rounded-xl border bg-background px-3 py-2 text-xs font-bold focus:border-primary focus:outline-none"
                          >
                            {OLEVEL_GRADES.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive h-9 w-9 p-0"
                            onClick={() => handleRemoveSubject(sIdx, subIdx)}
                            disabled={sitting.subjects.length <= 1}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1 border-dashed mt-2 text-xs rounded-xl hover:border-primary/50 hover:bg-primary/5"
                      onClick={() => handleAddSubject(sIdx)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Academic Subject
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* JAMB UTME PANEL */}
            <div className="rounded-3xl border bg-card p-6 shadow-soft space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-secondary/5 rounded-full blur-3xl -z-10" />
              <div className="border-b pb-4">
                <h3 className="font-display text-lg font-bold text-foreground">JAMB UTME Record</h3>
                <p className="text-xs text-muted-foreground">Enter your aggregate score and four distinct subject grades.</p>
              </div>

              <div className="flex items-center justify-between mb-4 bg-muted/20 p-4 rounded-2xl border border-dashed border-secondary/20">
                <div className="flex items-center gap-3">
                  {jambResultSlip ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">JAMB Slip Uploaded</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{jambResultSlip.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary-foreground">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Upload JAMB Slip</p>
                        <p className="text-[10px] text-muted-foreground">Auto-fills UTME details</p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  {jambResultSlip ? (
                     <div className="flex items-center gap-2">
                       <a href={`${BACKEND_URL}${jambResultSlip.url}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">View</a>
                       <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteDocument(jambResultSlip._id)}>
                         {deletingId === jambResultSlip._id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="h-3 w-3" />}
                       </Button>
                     </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleSingleUpload(e.target.files[0], 'jamb');
                        }
                      }} disabled={isJambUploading} />
                      <Button asChild size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl text-xs h-8" disabled={isJambUploading}>
                        <span>{isJambUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Select File'}</span>
                      </Button>
                    </label>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">JAMB Registration Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 20261234AB"
                    value={jambRegNo || ""}
                    onChange={(e) => setJambRegNo(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm font-bold text-primary focus:border-primary focus:outline-none"
                  />
                  {jambRegNo && !/^(19|20)\d{2}\d{4,8}[A-Z]{2}$/i.test(jambRegNo) && (
                    <p className="text-[10px] text-destructive font-medium mt-0.5">
                      Invalid format. Must be Year (4 digits) + 4 to 8 numbers + 2 letters (e.g. 20261234AB or 202330639047FF).
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Aggregate Score</label>
                  <input
                    type="number"
                    min="0"
                    max="400"
                    placeholder="0 - 400"
                    value={jambScore || ""}
                    onChange={(e) => setJambScore(Math.min(400, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm font-bold text-primary focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex items-center bg-muted/40 p-3.5 rounded-2xl border text-xs text-muted-foreground">
                  <Info className="h-4 w-4 mr-2 shrink-0 text-primary" />
                  <span>JAMB UTME contains exactly 4 subjects, where the first is locked to Use of English. Scores must add up to aggregate.</span>
                </div>
              </div>

              {/* Candidate Demographics Row */}
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4 bg-muted/10 p-4 rounded-2xl border">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Candidate Name</label>
                  <input
                    type="text"
                    placeholder="Full Name on Slip"
                    value={jambCandidateName}
                    onChange={(e) => setJambCandidateName(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</label>
                  <input
                    type="date"
                    value={jambDateOfBirth}
                    onChange={(e) => setJambDateOfBirth(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gender</label>
                  <select
                    value={jambGender}
                    onChange={(e) => setJambGender(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Exam Number</label>
                  <input
                    type="text"
                    placeholder="e.g. C05502116"
                    value={jambExamNo}
                    onChange={(e) => setJambExamNo(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Preferences and Demographics */}
              <div className="grid gap-4 sm:grid-cols-3 bg-muted/20 p-4 rounded-2xl border">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">State of Origin</label>
                  <select
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    value={stateOfOrigin}
                    onChange={(e) => {
                      setStateOfOrigin(e.target.value);
                      setLga("");
                    }}
                  >
                    <option value="">Select State</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">LGA of Origin</label>
                  {stateOfOrigin ? (
                    <select
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value={lga}
                      onChange={(e) => setLga(e.target.value)}
                    >
                      <option value="">Select LGA</option>
                      {(STATE_LGA_MAPPING[stateOfOrigin] || []).map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      value=""
                      disabled
                    >
                      <option value="">Select state first</option>
                    </select>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preferred Course (LASUSTECH)</label>
                  <select
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    value={preferredCourse}
                    onChange={(e) => setPreferredCourse(e.target.value)}
                  >
                    <option value="">Select Course</option>
                    {courseOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* JAMB Subjects table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  <span>Subject</span>
                  <span>Score (0-100)</span>
                </div>
                <div className="space-y-2">
                  {jambSubjects.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {idx === 0 ? (
                        // Locked to Use of English
                        <div className="flex-1 rounded-xl border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          Use of English <span className="text-[9px] uppercase bg-muted/90 rounded px-1 text-muted-foreground/80 shrink-0">Locked</span>
                        </div>
                      ) : (
                        <SearchableSubjectSelect
                          value={sub.name}
                          onChange={(val) => handleJambSubjectChange(idx, val)}
                          examType="JAMB"
                          excludeList={jambSubjects.map((s) => s.name)}
                          placeholder="Select JAMB subject..."
                          className="flex-1"
                        />
                      )}
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Score"
                        value={sub.score || ""}
                        onChange={(e) => handleJambScoreChange(idx, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-24 rounded-xl border bg-background px-3 py-2 text-xs font-bold text-center focus:border-primary focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {jambAdvisory.scoreMismatch && jambScore > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30 text-warning-foreground text-[11px]"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      Scores sum (<b>{jambAdvisory.sumOfSubjects}</b>) does not equal your Aggregate Score (<b>{jambScore}</b>).
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            <Button
              className="w-full bg-gradient-primary text-sm rounded-xl py-6 font-semibold shadow-glow"
              onClick={handleSaveProfile}
              disabled={isSaving || profileLoading}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Synchronizing Verification Vault...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Academic Credentials & Recalculate Recommendation Matrix
                </>
              )}
            </Button>
          </div>

          {/* SIDEBAR: ELIGIBILITY INTELLIGENCE & PATHWAYS */}
          <div className="space-y-6">
            {/* O'Level Pass Report */}
            <div className="rounded-3xl border bg-card p-5 shadow-soft space-y-4">
              <h4 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
                <BookOpen className="h-4.5 w-4.5 text-primary" /> O'Level Verification Engine
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs py-1 border-b">
                  <span className="text-muted-foreground">Unique subjects entered:</span>
                  <span className="font-bold">{combinedOLevelInfo.uniqueSubjects.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b">
                  <span className="text-muted-foreground">Total credit passes (A1-C6):</span>
                  <Badge tone={combinedOLevelInfo.passesCount >= 5 ? "success" : "destructive"}>
                    {combinedOLevelInfo.passesCount} / 5
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b">
                  <span className="text-muted-foreground">English Language Credit:</span>
                  <div className="flex items-center gap-1 font-bold">
                    <span className="text-xs">{combinedOLevelInfo.engGrade}</span>
                    {combinedOLevelInfo.hasEngCredit ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b">
                  <span className="text-muted-foreground">Mathematics Credit:</span>
                  <div className="flex items-center gap-1 font-bold">
                    <span className="text-xs">{combinedOLevelInfo.mathGrade}</span>
                    {combinedOLevelInfo.hasMathCredit ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b">
                  <span className="text-muted-foreground">Civic Education Credit:</span>
                  <div className="flex items-center gap-1 font-bold">
                    <span className="text-xs">{combinedOLevelInfo.civicGrade}</span>
                    {combinedOLevelInfo.hasCivicCredit ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
              </div>

              {/* WAEC 2026 Subject Combinations Strict Alert */}
              {combinedOLevelInfo.isEconomicsViolated && (
                <div className="rounded-2xl bg-warning/10 border border-warning/30 p-3.5 text-xs text-warning-foreground flex gap-2.5 shadow-sm animate-in fade-in duration-300">
                  <AlertCircle className="h-5 w-5 shrink-0 text-warning animate-bounce" />
                  <div>
                    <p className="font-bold">WAEC 2026 Combination Alert</p>
                    <p className="text-[10px] opacity-95 mt-1 leading-relaxed">
                      Science and Humanities/Arts candidates are <b>barred</b> from taking/combining <b>Economics</b> under the newly released WAEC 2026/2027 curriculum regulations. Economics is strictly restricted to Commercial/Business candidates.
                    </p>
                  </div>
                </div>
              )}

              {combinedOLevelInfo.meetsCore ? (
                <div className="rounded-2xl bg-success/10 border border-success/30 p-3 text-xs text-success-foreground flex gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                  <div>
                    <p className="font-bold">O'Level Baseline Qualified</p>
                    <p className="text-[10px] opacity-90 mt-0.5">Your combined credit passes meet the criteria for admission eligibility check.</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive-foreground flex gap-2">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-destructive" />
                  <div>
                    <p className="font-bold">Prerequisites Incomplete</p>
                    <p className="text-[10px] opacity-90 mt-0.5">
                      You must secure credits (A1-C6) in English Language, Mathematics, Civic Education, and at least 2 other unique subjects.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* JAMB Pathway Advisor */}
            <div className="rounded-3xl border bg-card p-5 shadow-soft space-y-4">
              <h4 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
                <GraduationCap className="h-4.5 w-4.5 text-secondary" /> Academic Pathway Adviser
              </h4>
              <div className="space-y-2 text-xs">
                <div className="py-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Identified Pathway</p>
                  <p className="font-display text-sm font-bold text-primary mt-0.5">{jambAdvisory.pathway}</p>
                </div>
                <div className="py-1 bg-muted/30 p-3 rounded-xl border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Advisory Guidance</p>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">{jambAdvisory.recommendations}</p>
                </div>
              </div>

              {jambScore >= 200 ? (
                <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3 text-xs text-primary flex gap-2">
                  <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-bold">High Competitive Tier</p>
                    <p className="text-[10px] opacity-90 mt-0.5">JAMB score of 200+ gives you high probability matching for top federal & state institutions.</p>
                  </div>
                </div>
              ) : jambScore > 0 ? (
                <div className="rounded-2xl bg-muted/60 border p-3 text-xs text-muted-foreground flex gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-bold font-display text-foreground text-xs">Standard Competitive Tier</p>
                    <p className="text-[10px] mt-0.5">Explore institutions matching your target cutoffs. Some private and state universities accept standard tier scores.</p>
                  </div>
                </div>
              ) : null}
            </div>

            
          </div>
        </div>
    </div>
  );
}
