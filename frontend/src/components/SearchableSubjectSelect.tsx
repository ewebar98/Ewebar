import React, { useState, useEffect, useRef, useMemo } from "react";
import { searchSubjects, Subject } from "../services/api";
import { Search, ChevronDown, Check, Star, Loader2, X } from "lucide-react";

interface SearchableSubjectSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  examType?: string;
  excludeList?: string[]; // To prevent duplicate subject selection
  className?: string;
}

// In-memory query cache to eliminate redundant network requests
const queryCache = new Map<string, Subject[]>();

export const SearchableSubjectSelect: React.FC<SearchableSubjectSelectProps> = ({
  value,
  onChange,
  placeholder = "Search subject...",
  examType,
  excludeList = [],
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Click escape to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Load initial options when modal is opened
  const loadInitialOptions = async () => {
    setIsLoading(true);
    const cacheKey = `initial-${examType || "all"}`;
    if (queryCache.has(cacheKey)) {
      setSubjects(queryCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch core and popular subjects (relaxation limit to 100 on initial view to show full catalog)
      const initial = await searchSubjects("", { examType, limit: 100 });
      queryCache.set(cacheKey, initial);
      setSubjects(initial);
    } catch (err) {
      console.error("Failed to load initial subjects", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced and cached search function
  const triggerSearch = async (term: string) => {
    setIsLoading(true);
    const cacheKey = `${term.toLowerCase()}-${examType || "all"}`;
    
    if (queryCache.has(cacheKey)) {
      setSubjects(queryCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    try {
      // Relax limit to 50 results to allow broad related subjects display
      const results = await searchSubjects(term, { examType, limit: 50 });
      queryCache.set(cacheKey, results);
      setSubjects(results);
    } catch (err) {
      console.error("Failed to query subjects", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced input handler (150ms for ultra responsiveness)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      triggerSearch(term);
    }, 150);
  };

  // Open the modal and load dynamic list
  const handleOpenModal = () => {
    setIsOpen(true);
    setSearchTerm(""); // Reset search when opening
    loadInitialOptions();
  };

  // Group fetched subjects by category
  const groupedSubjects = useMemo(() => {
    const groups: Record<string, Subject[]> = {};
    subjects.forEach((sub) => {
      const cat = sub.category.toUpperCase();
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(sub);
    });
    return groups;
  }, [subjects]);

  const selectSubject = (subjectName: string) => {
    onChange(subjectName);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button Field */}
      <div
        onClick={handleOpenModal}
        className="flex items-center justify-between rounded-xl border border-border bg-background hover:bg-muted/30 px-3.5 py-2.5 text-xs font-semibold cursor-pointer transition-all duration-300 hover:border-primary/50 group"
      >
        <span className={value ? "text-foreground font-bold" : "text-muted-foreground font-medium"}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
          <Search className="h-3.5 w-3.5" />
          <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300" />
        </div>
      </div>

      {/* Spacious Full Screen Subject Picker Pop-up Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-200">
          
          {/* Backdrop Click Out */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* Centered Spacious Modal Container */}
          <div className="relative w-full max-w-3xl bg-card border border-border/80 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 z-[110]">
            
            {/* Top Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title Board Indicator Header */}
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {examType || "National"} Board
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-border" />
                <h3 className="font-display text-lg font-bold text-foreground">Select Academic Subject</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Search or browse the official Nigerian examinations catalog.
              </p>
            </div>

            {/* Glowing Search Box */}
            <div className="relative mb-6 flex items-center bg-muted/40 rounded-2xl border border-border/80 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
              <Search className="absolute left-4.5 h-4.5 w-4.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                placeholder={`Type to search official ${examType || ""} subjects...`}
                className="w-full bg-transparent pl-12 pr-12 py-3.5 text-sm font-semibold text-foreground focus:outline-none placeholder-muted-foreground"
                autoFocus
              />
              {isLoading && (
                <Loader2 className="absolute right-4.5 h-4.5 w-4.5 animate-spin text-primary" />
              )}
            </div>

            {/* Spacious Category-Grid Subject Content */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-6 select-none max-h-[50vh]">
              {subjects.length === 0 && !isLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Search className="h-8 w-8 text-muted-foreground/40 animate-pulse" />
                  <span>No matching subjects found. Try typing another term.</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedSubjects).map(([category, list]) => {
                    // Pre-calculate active subjects for display
                    if (list.length === 0) return null;

                    return (
                      <div key={category} className="space-y-3">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                            {category}
                          </span>
                          <div className="h-[1px] flex-1 bg-border/40" />
                          <span className="text-[10px] font-bold text-muted-foreground/60">
                            {list.length} {list.length === 1 ? "subject" : "subjects"}
                          </span>
                        </div>

                        {/* 2-3 Column Subject Grid Table */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 px-0.5">
                          {list.map((sub) => {
                            const isSelected = sub.name === value;
                            const isExcluded = excludeList.includes(sub.name) && sub.name !== value;

                            return (
                              <button
                                key={sub.slug}
                                type="button"
                                disabled={isExcluded}
                                onClick={() => selectSubject(sub.name)}
                                className={`group flex flex-col justify-between items-start text-left p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                                  isSelected
                                    ? "bg-primary/10 border-primary text-primary font-bold shadow-md"
                                    : isExcluded
                                    ? "bg-muted/10 border-border/40 text-muted-foreground/50 opacity-40 cursor-not-allowed"
                                    : "bg-background hover:bg-muted/30 border-border hover:border-primary/40 text-foreground"
                                }`}
                              >
                                {/* Active background highlights */}
                                {isSelected && (
                                  <div className="absolute top-0 right-0 h-10 w-10 bg-primary/10 rounded-full blur-xl" />
                                )}

                                <div className="flex items-start justify-between w-full gap-2">
                                  <span className="text-xs font-semibold leading-snug">
                                    {sub.name}
                                  </span>
                                  {isSelected && (
                                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                  )}
                                </div>

                                {/* Subject details footer inside card */}
                                <div className="flex items-center gap-1.5 mt-2.5 w-full">
                                  {sub.isCoreSubject && (
                                    <span className="flex items-center gap-0.5 rounded-full bg-primary/20 text-primary px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide">
                                      <Star className="h-2 w-2" />
                                      Core
                                    </span>
                                  )}
                                  {isExcluded && (
                                    <span className="rounded-full bg-muted/60 text-muted-foreground px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide">
                                      Added
                                    </span>
                                  )}
                                  {sub.shortName && sub.shortName !== sub.name && (
                                    <span className="text-[9px] text-muted-foreground leading-none">
                                      {sub.shortName}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Clean Info Footer */}
            <div className="mt-5 border-t pt-4 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Press <kbd className="bg-muted px-1.5 py-0.5 rounded border">ESC</kbd> to exit picker</span>
              <span>Select any subject cell in the table grid to update</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
