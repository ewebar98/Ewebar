import mongoose from "mongoose";

// 1. Institution Schema
const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add an institution name"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    institutionType: {
      type: String,
      required: true,
      enum: ["university", "polytechnic", "college_of_education", "school_of_nursing"],
      index: true,
    },
    ownershipType: {
      type: String,
      required: true,
      enum: ["federal", "state", "private"],
      index: true,
    },
    accreditation: {
      type: String,
      default: "Accredited",
    },
    state: {
      type: String,
      required: true,
      index: true,
    },
    city: {
      type: String,
      required: true,
    },
    geo: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [7.4985, 9.0765],
      },
    },
    logo: {
      type: String,
      default: "🎓",
    },
    banner: {
      type: String,
      default: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
    },
    tuition: {
      type: String,
      default: "₦150,000/yr",
    },
    acceptanceRate: {
      type: Number,
      default: 25,
    },
    studentPopulation: {
      type: Number,
      default: 15000,
    },
    ranking: {
      type: Number,
      default: 10,
    },
    tags: [String],
    socialLinks: {
      website: String,
      facebook: String,
      twitter: String,
      linkedin: String,
    },
    admissionRequirements: String,
    metadata: {
      title: String,
      description: String,
    },
  },
  {
    timestamps: true,
  }
);

// Slugify institution name (Synchronous promise-less validate hook)
institutionSchema.pre("validate", function () {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});

// High performance compound text search index for Institution
institutionSchema.index({ name: "text", city: "text", state: "text", tags: "text" });

// Compound filter optimization indexes to support high-volume sub-millisecond client queries
institutionSchema.index({ state: 1, institutionType: 1, name: 1 });

export const Institution = mongoose.model("Institution", institutionSchema);

// 2. Faculty Schema
const facultySchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Please add a faculty name"],
    },
    slug: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

facultySchema.pre("validate", function () {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});

export const Faculty = mongoose.model("Faculty", facultySchema);

// 3. Department Schema
const departmentSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Please add a department name"],
    },
    slug: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.pre("validate", function () {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});

export const Department = mongoose.model("Department", departmentSchema);

// 4. Program Schema (Replaces Course)
const programSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Please add a program name"],
    },
    slug: {
      type: String,
      index: true,
    },
    duration: {
      type: String,
      default: "4 years",
    },
    cutoffMark: {
      type: Number,
      default: 200,
    },
    tuition: {
      type: String,
      default: "₦150,000/yr",
    },
    totalCapacity: {
      type: Number,
      default: 100, // Default capacity
    },
    currentAdmitted: {
      type: Number,
      default: 0,
    },
    requirements: [String],
    careerPaths: [String],
    description: String,
  },
  {
    timestamps: true,
  }
);

programSchema.pre("validate", function () {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});

// High performance compound text search index
programSchema.index({ name: "text", description: "text" });

// High performance relational and pre-filtering indexes to accelerate recommendation pipelines
programSchema.index({ cutoffMark: 1, name: 1 });

export const Program = mongoose.model("Program", programSchema);
