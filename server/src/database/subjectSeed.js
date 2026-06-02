import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns";
import Subject from "../models/subjectModel.js";

dotenv.config();

const subjectsList = [
  // ==================== COMPULSORY CORE SUBJECTS ====================
  {
    name: "English Language",
    shortName: "English",
    category: "language",
    isCoreSubject: true,
    language: "English",
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Use of English", "English Lang", "English"],
    keywords: ["grammar", "comprehension", "essay", "letter writing", "speech", "phonetics", "english", "compulsory"],
    code: "CORE-001"
  },
  {
    name: "General Mathematics",
    shortName: "Mathematics",
    category: "science",
    isCoreSubject: true,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Maths", "Math", "Mathematics", "General Maths"],
    keywords: ["arithmetic", "algebra", "geometry", "calculus", "calculation", "further maths", "compulsory"],
    code: "CORE-002"
  },
  {
    name: "Civic Education",
    shortName: "Civic Ed",
    category: "arts",
    isCoreSubject: true,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Civics", "Citizenship and Heritage Studies", "Citizenship Education", "Heritage Studies"],
    keywords: ["citizenship", "values", "rights", "responsibilities", "society", "democracy", "human rights", "compulsory"],
    code: "CORE-003"
  },

  // ==================== SCIENCE STREAM ELECTIVES ====================
  {
    name: "Biology",
    shortName: "Biology",
    category: "science",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Bio"],
    keywords: ["plants", "animals", "genetics", "ecology", "anatomy", "physiology", "cells", "organs"],
    code: "SC-001"
  },
  {
    name: "Chemistry",
    shortName: "Chemistry",
    category: "science",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Chem"],
    keywords: ["atoms", "elements", "organic", "inorganic", "equations", "reactions", "acid", "bases", "salts"],
    code: "SC-002"
  },
  {
    name: "Physics",
    shortName: "Physics",
    category: "science",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Phy"],
    keywords: ["electricity", "mechanics", "waves", "heat", "optics", "energy", "force", "atoms"],
    code: "SC-003"
  },
  {
    name: "Further Mathematics",
    shortName: "Further Maths",
    category: "science",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Further Math", "Add Maths", "Additional Mathematics"],
    keywords: ["calculus", "trigonometry", "vectors", "mechanics", "pure maths", "integration", "differentiation"],
    code: "SC-004"
  },
  {
    name: "Agricultural Science",
    shortName: "Agric Sci",
    category: "science",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Agric", "Agriculture"],
    keywords: ["farming", "crops", "livestock", "soil", "husbandry", "cultivation", "pests"],
    code: "SC-005"
  },
  {
    name: "Geography",
    shortName: "Geography",
    category: "science",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "GCE", "JAMB"],
    aliases: ["Geog"],
    keywords: ["maps", "earth", "climate", "environment", "population", "rocks", "topography", "weather"],
    code: "SC-006"
  },
  {
    name: "Technical Drawing",
    shortName: "Tech Drawing",
    category: "science",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["TD", "Technical Draw", "Engineering Drawing"],
    keywords: ["geometry", "drafting", "isometric", "orthographic", "engineering", "architecture", "plans"],
    code: "SC-007"
  },
  {
    name: "Physical Education",
    shortName: "Physical Ed",
    category: "science",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "GCE"],
    aliases: ["PE", "P.E.", "Gymnastics", "Sports Science"],
    keywords: ["sports", "exercise", "training", "athletics", "anatomy", "fitness", "coaching"],
    code: "SC-008"
  },
  {
    name: "Health Science / Health Education",
    shortName: "Health Sci",
    category: "science",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Health Education", "Health Science", "PHE", "Physical & Health Education"],
    keywords: ["hygiene", "body", "nutrition", "first aid", "diseases", "wellness", "health"],
    code: "SC-009"
  },
  {
    name: "Foods and Nutrition",
    shortName: "Foods & Nutrition",
    category: "science",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Food and Nutrition", "Home Economics (Food)", "Food Nutrition", "Food & Nutrition"],
    keywords: ["diet", "vitamins", "nutrients", "cooking", "health", "meal planning", "hygiene", "baking", "nutrition"],
    code: "SC-010"
  },
  {
    name: "Integrated Science",
    shortName: "Integrated Sci",
    category: "science",
    isCoreSubject: false,
    examTypes: ["WAEC", "GCE"],
    aliases: ["Int Science", "Integrated Science", "General Science"],
    keywords: ["general science", "basic chemistry", "basic physics", "basic biology", "ghana science", "integrated"],
    code: "SC-011"
  },
  {
    name: "Computer Studies / ICT",
    shortName: "Computer Studies",
    category: "science",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["ICT", "Information Tech", "Computer Studies", "Computer", "Information and Communication Technology"],
    keywords: ["hardware", "software", "programming", "internet", "algorithms", "word processing", "networks", "coding"],
    code: "SC-012"
  },

  // ==================== HUMANITIES & ARTS STREAM ELECTIVES ====================
  {
    name: "Literature-in-English",
    shortName: "Literature",
    category: "arts",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Lit in English", "Literature in English", "Eng Lit", "Literature"],
    keywords: ["prose", "poetry", "drama", "plays", "novels", "shakespeare", "literature"],
    code: "AR-001"
  },
  {
    name: "Government",
    shortName: "Government",
    category: "arts",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Govt", "Gov", "Politics and Governance", "Government / Politics and Governance"],
    keywords: ["politics", "constitution", "democracy", "state", "citizenship", "elections", "power", "governance"],
    code: "AR-002"
  },
  {
    name: "History",
    shortName: "History",
    category: "arts",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "GCE", "JAMB"],
    aliases: ["Hist", "Nigerian History", "History / Nigerian History"],
    keywords: ["nigeria", "past", "empires", "wars", "colonization", "independence", "historical"],
    code: "AR-003"
  },
  {
    name: "Christian Religious Studies",
    shortName: "CRS",
    category: "arts",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["CRK", "Christian Religious Knowledge", "CRS / CRK", "CRS"],
    keywords: ["bible", "jesus", "prophets", "gospel", "religion", "christian", "testament"],
    code: "AR-004"
  },
  {
    name: "Islamic Religious Studies",
    shortName: "IRS",
    category: "arts",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["IRK", "Islamic Religious Knowledge", "IRS / IRK", "IRS"],
    keywords: ["quran", "muhammad", "hadith", "allah", "religion", "islam", "muslim"],
    code: "AR-005"
  },
  {
    name: "West African Traditional Religion",
    shortName: "Traditional Religion",
    category: "arts",
    isCoreSubject: false,
    examTypes: ["WAEC", "GCE"],
    aliases: ["WATR", "Traditional Religion", "Traditional Religious Studies", "WATRK"],
    keywords: ["religion", "ghana religion", "traditional studies", "shrines", "ancestors", "customs"],
    code: "AR-006"
  },
  {
    name: "Visual Arts / Fine Art",
    shortName: "Visual Arts",
    category: "arts",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "GCE", "JAMB"],
    aliases: ["Visual Art", "Fine Art", "Fine Arts", "Creative Art", "Art"],
    keywords: ["drawing", "painting", "sculpture", "design", "ceramics", "sketching", "exhibition", "graphics"],
    code: "AR-007"
  },
  {
    name: "Music",
    shortName: "Music",
    category: "arts",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "GCE", "JAMB"],
    aliases: ["Musical Studies"],
    keywords: ["theory", "instruments", "singing", "harmony", "composer", "solfa", "melody"],
    code: "AR-008"
  },

  // ==================== COMMERCIAL & BUSINESS ELECTIVES ====================
  {
    name: "Economics",
    shortName: "Economics",
    category: "commercial",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Econ"],
    keywords: ["microeconomics", "macroeconomics", "demand", "supply", "inflation", "gdp", "markets"],
    code: "CM-001"
  },
  {
    name: "Financial Accounting",
    shortName: "Accounting",
    category: "commercial",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Accounts", "Financial Account", "Principles of Accounts"],
    keywords: ["ledger", "balance sheet", "journal", "audit", "banking", "finance", "accounts", "bookkeeping"],
    code: "CM-002"
  },
  {
    name: "Commerce",
    shortName: "Commerce",
    category: "commercial",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Comm"],
    keywords: ["trade", "advertising", "transportation", "retail", "wholesale", "business", "warehousing"],
    code: "CM-003"
  },
  {
    name: "Marketing",
    shortName: "Marketing",
    category: "commercial",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE", "JAMB"],
    aliases: ["Mkt"],
    keywords: ["selling", "branding", "consumer", "advertisement", "product", "distribution", "price"],
    code: "CM-004"
  },
  {
    name: "Office Practice",
    shortName: "Office Prac",
    category: "commercial",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Office Practice", "Secretarial Studies"],
    keywords: ["filing", "correspondence", "administration", "typing", "office management", "clerical"],
    code: "CM-005"
  },
  {
    name: "Business Management",
    shortName: "Business Mgmt",
    category: "commercial",
    isCoreSubject: false,
    examTypes: ["WAEC", "GCE", "JAMB"],
    aliases: ["Business Management", "Business Studies", "Management", "Intro to Business"],
    keywords: ["business", "management", "administration", "commerce", "enterprises", "marketing"],
    code: "CM-006"
  },
  {
    name: "Insurance",
    shortName: "Insurance",
    category: "commercial",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "GCE"],
    aliases: ["Insur"],
    keywords: ["risk", "underwriting", "policy", "premium", "indemnity", "assurance", "claim"],
    code: "CM-007"
  },
  {
    name: "Shorthand",
    shortName: "Shorthand",
    category: "commercial",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "GCE"],
    aliases: ["Stenography"],
    keywords: ["stenography", "typing", "secretarial", "shorthand", "transcription"],
    code: "CM-008"
  },
  {
    name: "Typewriting",
    shortName: "Typewriting",
    category: "commercial",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Keyboarding", "Typewrite"],
    keywords: ["typing", "keyboarding", "secretarial", "typewrite", "clerical"],
    code: "CM-009"
  },

  // ==================== CROSS-REGIONAL & INDIGENOUS LANGUAGES ====================
  {
    name: "Yoruba Language",
    shortName: "Yoruba",
    category: "language",
    isCoreSubject: false,
    language: "Yoruba",
    examTypes: ["WAEC", "NECO", "GCE", "JAMB"],
    aliases: ["Yoruba", "Asa Yoruba"],
    keywords: ["culture", "literature", "yoruba grammar", "translation", "customs", "language", "nigerian"],
    code: "LG-001"
  },
  {
    name: "Hausa Language",
    shortName: "Hausa",
    category: "language",
    isCoreSubject: false,
    language: "Hausa",
    examTypes: ["WAEC", "NECO", "GCE", "JAMB"],
    aliases: ["Hausa", "Harshen Hausa"],
    keywords: ["culture", "literature", "hausa grammar", "translation", "customs", "language", "nigerian"],
    code: "LG-002"
  },
  {
    name: "Igbo Language",
    shortName: "Igbo",
    category: "language",
    isCoreSubject: false,
    language: "Igbo",
    examTypes: ["WAEC", "NECO", "GCE", "JAMB"],
    aliases: ["Igbo", "Asusu Igbo"],
    keywords: ["culture", "literature", "igbo grammar", "translation", "customs", "language", "nigerian"],
    code: "LG-003"
  },
  {
    name: "French",
    shortName: "French",
    category: "language",
    isCoreSubject: false,
    language: "French",
    examTypes: ["WAEC", "NECO", "GCE", "JAMB"],
    aliases: ["Français", "French Language"],
    keywords: ["grammar", "translation", "vocabulary", "comprehension", "french language", "culture"],
    code: "LG-004"
  },
  {
    name: "Arabic",
    shortName: "Arabic",
    category: "language",
    isCoreSubject: false,
    language: "Arabic",
    examTypes: ["WAEC", "NECO", "GCE", "JAMB"],
    aliases: ["Arabic Language"],
    keywords: ["grammar", "translation", "vocabulary", "comprehension", "islamic text", "language"],
    code: "LG-005"
  },
  {
    name: "Edo Language",
    shortName: "Edo",
    category: "language",
    isCoreSubject: false,
    language: "Edo",
    examTypes: ["WAEC", "NECO", "GCE"],
    aliases: ["Edo"],
    keywords: ["indigenous", "nigerian language", "edo", "culture", "midwest"],
    code: "LG-006"
  },
  {
    name: "Efik Language",
    shortName: "Efik",
    category: "language",
    isCoreSubject: false,
    language: "Efik",
    examTypes: ["WAEC", "NECO", "GCE"],
    aliases: ["Efik"],
    keywords: ["indigenous", "nigerian language", "efik", "calabar", "culture"],
    code: "LG-007"
  },
  {
    name: "Ibibio Language",
    shortName: "Ibibio",
    category: "language",
    isCoreSubject: false,
    language: "Ibibio",
    examTypes: ["WAEC", "NECO", "GCE"],
    aliases: ["Ibibio"],
    keywords: ["indigenous", "nigerian language", "ibibio", "akwa ibom", "culture"],
    code: "LG-008"
  },
  {
    name: "Twi (Asante/Aquapem)",
    shortName: "Twi",
    category: "language",
    isCoreSubject: false,
    language: "Twi",
    examTypes: ["WAEC", "GCE"],
    aliases: ["Twi Language", "Asante", "Akuapem", "Akan"],
    keywords: ["ghana", "indigenous", "african language", "twi", "akan", "ashanti"],
    code: "LG-009"
  },
  {
    name: "Fante",
    shortName: "Fante",
    category: "language",
    isCoreSubject: false,
    language: "Fante",
    examTypes: ["WAEC", "GCE"],
    aliases: ["Fante Language"],
    keywords: ["ghana", "indigenous", "african language", "fante", "akan"],
    code: "LG-010"
  },
  {
    name: "Ga",
    shortName: "Ga",
    category: "language",
    isCoreSubject: false,
    language: "Ga",
    examTypes: ["WAEC", "GCE"],
    aliases: ["Ga Language"],
    keywords: ["ghana", "indigenous", "african language", "ga", "accra"],
    code: "LG-011"
  },
  {
    name: "Ewe",
    shortName: "Ewe",
    category: "language",
    isCoreSubject: false,
    language: "Ewe",
    examTypes: ["WAEC", "GCE"],
    aliases: ["Ewe Language"],
    keywords: ["ghana", "indigenous", "african language", "ewe", "volta"],
    code: "LG-012"
  },
  {
    name: "Dagbani",
    shortName: "Dagbani",
    category: "language",
    isCoreSubject: false,
    language: "Dagbani",
    examTypes: ["WAEC", "GCE"],
    aliases: ["Dagbani Language"],
    keywords: ["ghana", "indigenous", "african language", "dagbani", "northern"],
    code: "LG-013"
  },
  {
    name: "Nzema",
    shortName: "Nzema",
    category: "language",
    isCoreSubject: false,
    language: "Nzema",
    examTypes: ["WAEC", "GCE"],
    aliases: ["Nzema Language"],
    keywords: ["ghana", "indigenous", "african language", "nzema"],
    code: "LG-014"
  },

  // ==================== TECHNICAL & VOCATIONAL TRADE OPTIONS ====================
  {
    name: "Animal Husbandry",
    shortName: "Animal Husbandry",
    category: "vocational",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Animal Husb", "Animal Production", "Livestock farming"],
    keywords: ["cattle", "farming", "poultry", "livestock", "reproduction", "veterinary", "goats", "pigs", "trade", "husbandry"],
    code: "TD-001"
  },
  {
    name: "Fisheries",
    shortName: "Fisheries",
    category: "vocational",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "GCE"],
    aliases: ["Fishery", "Fishery Science"],
    keywords: ["fish farming", "aquaculture", "ponds", "marine life", "breeding", "aquarium", "trade"],
    code: "TD-002"
  },
  {
    name: "Catering Craft Practice",
    shortName: "Catering Craft",
    category: "technical",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Catering", "Catering Practice", "Catering Craft"],
    keywords: ["cooking", "baking", "food preparation", "hospitality", "menu planning", "hotel management", "trade", "artisan"],
    code: "TD-003"
  },
  {
    name: "Garment Making",
    shortName: "Garment Making",
    category: "vocational",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Tailoring", "Fashion Design", "Garment making"],
    keywords: ["sewing", "pattern drafting", "fabrics", "tailoring", "embroidery", "clothing", "fashion", "trade", "artisan"],
    code: "TD-004"
  },
  {
    name: "Cosmetology",
    shortName: "Cosmetology",
    category: "vocational",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Hairdressing", "Makeup", "Beauty Therapy"],
    keywords: ["hair care", "skincare", "cosmetics", "manicure", "pedicure", "salons", "styling", "trade", "artisan"],
    code: "TD-005"
  },
  {
    name: "Photography",
    shortName: "Photography",
    category: "vocational",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "GCE"],
    aliases: ["Photo", "Photographic Studies"],
    keywords: ["camera", "photo", "art", "media", "entrepreneurship", "trade", "digital imaging"],
    code: "TD-006"
  },
  {
    name: "Plumbing",
    shortName: "Plumbing",
    category: "technical",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Plumbing Craft Practice", "Plumbing & Pipefitting"],
    keywords: ["water", "pipes", "installations", "technical", "artisan", "plumbing", "drainage", "trade"],
    code: "TD-007"
  },
  {
    name: "Welding & Fabrication Engineering Craft Practice",
    shortName: "Welding & Fabrication",
    category: "technical",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Welding", "Welding Craft", "Welding & Fabrication"],
    keywords: ["metalwork", "arc welding", "gas welding", "cutting", "fabrication", "safety", "metallurgy", "trade", "technical"],
    code: "TD-008"
  },
  {
    name: "Woodwork",
    shortName: "Woodwork",
    category: "technical",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Woodwork Craft", "Carpentry"],
    keywords: ["timber", "carpentry", "joints", "tools", "furniture", "varnishing", "wood designing", "trade", "technical"],
    code: "TD-009"
  },
  {
    name: "Auto Mechanics",
    shortName: "Auto Mechanics",
    category: "technical",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Auto Mech", "Motor Vehicle Mechanics"],
    keywords: ["engine", "transmission", "gears", "carburetor", "suspension", "brake systems", "automotive", "trade", "technical"],
    code: "TD-010"
  },
  {
    name: "Electrical Installation & Maintenance Work",
    shortName: "Electrical Installation",
    category: "technical",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Electrical Installation", "Electrical Work", "EIMW", "Electrical maintenance"],
    keywords: ["wiring", "circuits", "cables", "maintenance", "fuses", "appliances", "conduits", "trade", "technical"],
    code: "TD-011"
  },
  {
    name: "Blocklaying, Bricklaying & Concrete Work",
    shortName: "Blocklaying & Concrete",
    category: "technical",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Blocklaying", "Bricklaying", "Concrete Work"],
    keywords: ["masonry", "cement", "bricks", "construction", "foundations", "walls", "mortar", "trade", "technical"],
    code: "TD-012"
  },
  {
    name: "Radio, Television & Electronics Works",
    shortName: "Radio & TV Works",
    category: "technical",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Electronics Works", "Radio TV Work", "Radio & TV Repairs"],
    keywords: ["circuits", "resistors", "transmitters", "soldering", "signal transmission", "repairing", "trade", "technical"],
    code: "TD-013"
  },
  {
    name: "Metal Work",
    shortName: "Metal Work",
    category: "technical",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Metal Work Craft"],
    keywords: ["fitting", "lathe", "milling", "iron", "casting", "forging", "shaping", "drilling", "trade", "technical"],
    code: "TD-014"
  },
  {
    name: "Dyeing & Bleaching",
    shortName: "Dyeing & Bleaching",
    category: "vocational",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "GCE"],
    aliases: ["Tie & Dye", "Batik Craft"],
    keywords: ["textiles", "batik", "pigments", "fabric design", "bleach", "patterns", "cloth coloring", "trade"],
    code: "TD-015"
  },
  {
    name: "Book Keeping",
    shortName: "Book Keeping",
    category: "vocational",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Bookkeeping"],
    keywords: ["accounting records", "cashbook", "ledgers", "transactions", "invoice", "receipts", "trade"],
    code: "TD-016"
  },
  {
    name: "Store Management",
    shortName: "Store Management",
    category: "commercial",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Store Keeping", "Storekeeping"],
    keywords: ["inventory", "warehousing", "stock control", "logistics", "records", "storekeeper", "trade"],
    code: "TD-017"
  },
  {
    name: "Salesmanship",
    shortName: "Salesmanship",
    category: "commercial",
    isCoreSubject: false,
    examTypes: ["WAEC", "NECO", "NABTEB", "GCE"],
    aliases: ["Sales"],
    keywords: ["selling skills", "customer service", "negotiation", "retail sales", "pitching", "trade"],
    code: "TD-018"
  }
];

const seedSubjects = async () => {
  try {
    // Force process-level public DNS resolvers to resolve MONGODB_URI SRV records successfully,
    // bypassing any querySrv ECONNREFUSED blocks from local ISP or network DNS limitations.
    try {
      dns.setServers(["1.1.1.1", "8.8.8.8"]);
    } catch (dnsErr) {
      console.warn("[DNS Resolution Warning] Failed to set public DNS servers:", dnsErr.message);
    }

    console.log("Establishing database connection for Subject Seeder...");
    const connectionUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ewebar";
    const maskedUri = connectionUri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
    console.log(`Connecting to: ${maskedUri}`);
    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`Connected successfully to database: ${conn.connection.db.databaseName}`);

    console.log("Clearing all existing Subject entries...");
    await Subject.deleteMany({});
    console.log("Subject collection wiped.");

    console.log(`Bulk inserting ${subjectsList.length} production-grade subjects...`);
    const results = await Subject.create(subjectsList);
    console.log(`Successfully ingested ${results.length} subjects into database!`);

    console.log("Verifying indexes...");
    await Subject.syncIndexes();
    console.log("Indexes successfully synchronized and verified.");

    console.log("\x1b[32m[Seeder Success] Subject Engine database population finished successfully!\x1b[0m");
    process.exit(0);
  } catch (error) {
    console.error(`\x1b[31m[Seeder Failure] Database seeding aborted due to error: ${error.message}\x1b[0m`);
    process.exit(1);
  }
};

seedSubjects();
