import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a subject name"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Please add a category"],
      enum: ["science", "arts", "commercial", "technical", "language", "vocational"],
      index: true,
      trim: true,
    },
    examTypes: {
      type: [String],
      required: true,
      index: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "A subject must support at least one exam type (e.g. WAEC, NECO, JAMB)",
      },
    },
    aliases: {
      type: [String],
      default: [],
      index: true,
    },
    keywords: {
      type: [String],
      default: [],
      index: true,
    },
    isCoreSubject: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: "",
      trim: true,
    },
    code: {
      type: String,
      default: "",
      trim: true,
    },
    searchableText: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Automatic slug and searchableText pre-validation pre-hook
subjectSchema.pre("validate", function (next) {
  if (this.name) {
    if (!this.slug) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    
    // Automatically generate clean aliases if none provided (e.g., shortName)
    if (this.shortName && !this.aliases.includes(this.shortName)) {
      this.aliases.push(this.shortName);
    }

    // Pre-calculate highly indexed searchable text
    const searchTerms = [
      this.name,
      this.shortName,
      this.category,
      this.code,
      ...(this.aliases || []),
      ...(this.keywords || []),
    ]
      .filter(Boolean)
      .map((term) => term.toLowerCase().trim());

    // Deduplicate and join
    this.searchableText = Array.from(new Set(searchTerms)).join(" ");
  }
  next();
});

// High performance compound text search index
subjectSchema.index({
  name: "text",
  shortName: "text",
  aliases: "text",
  keywords: "text",
  searchableText: "text",
}, {
  language_override: "none"
});

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
