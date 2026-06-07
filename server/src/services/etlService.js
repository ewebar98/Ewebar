import { Institution, Faculty, Department, Program } from "../models/universityModel.js";

/**
 * Enterprise ETL Ingestion & Normalization Service for Nigerian Tertiary Institutions.
 */
export class ETLService {
  /**
   * Normalizes raw institution data into unified schema formats.
   */
  static normalizeInstitution(raw) {
    const name = raw.name.trim();
    const city = raw.city ? raw.city.trim() : "Unknown";
    const state = raw.state ? raw.state.trim() : "Nigeria";
    
    // Generate clean slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return {
      name,
      slug,
      institutionType: raw.institutionType.toLowerCase(),
      ownershipType: raw.ownershipType.toLowerCase(),
      accreditation: raw.accreditation || "Accredited by regulatory board",
      state,
      city,
      geo: {
        type: "Point",
        coordinates: raw.coordinates || [7.4985, 9.0765], // default Abuja long/lat
      },
      logo: raw.logo || "🎓",
      banner: raw.banner || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
      tuition: raw.tuition || "₦150,000/yr",
      acceptanceRate: Number(raw.acceptanceRate) || 25,
      studentPopulation: Number(raw.studentPopulation) || 12000,
      ranking: Number(raw.ranking) || 99,
      tags: raw.tags || [],
      socialLinks: {
        website: raw.website || "",
        facebook: raw.facebook || "",
        twitter: raw.twitter || "",
        linkedin: raw.linkedin || "",
      },
      admissionRequirements: raw.admissionRequirements || "General requirements include JAMB score matching cutoff and WAEC/NECO credits.",
      metadata: {
        title: `${name} Admissions & Programs | WeBAR`,
        description: `Explore academic requirements, tuitions, and popular departments at ${name} (${state} State).`,
      },
    };
  }

  /**
   * Validates normalized institution payloads against constraints.
   */
  static validateInstitution(item) {
    const errors = [];
    if (!item.name) errors.push("Institution name is required.");
    if (!["university", "polytechnic", "college_of_education"].includes(item.institutionType)) {
      errors.push(`Invalid institutionType: ${item.institutionType}`);
    }
    if (!["federal", "state", "private"].includes(item.ownershipType)) {
      errors.push(`Invalid ownershipType: ${item.ownershipType}`);
    }
    if (!item.state || !item.city) {
      errors.push("Location fields (state, city) are required.");
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Safe import pipeline that deduplicates and saves institutions in bulk.
   */
  static async ingestInstitution(rawItem) {
    const normalized = this.normalizeInstitution(rawItem);
    const { valid, errors } = this.validateInstitution(normalized);
    
    if (!valid) {
      throw new Error(`ETL Validation failed: ${errors.join(", ")}`);
    }

    // Deduplication check: verify if name or slug already exists in DB
    const existing = await Institution.findOne({
      $or: [{ name: normalized.name }, { slug: normalized.slug }],
    });

    if (existing) {
      // Return existing document if duplicate detected (Deduplication Strategy)
      return existing;
    }

    // Insert new unique record
    return await Institution.create(normalized);
  }

  /**
   * Normalizes and imports a Faculty under an Institution.
   */
  static async ingestFaculty(institutionId, rawName) {
    const name = rawName.trim();
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await Faculty.findOne({ institutionId, name });
    if (existing) return existing;

    return await Faculty.create({ institutionId, name, slug });
  }

  /**
   * Normalizes and imports a Department under a Faculty.
   */
  static async ingestDepartment(institutionId, facultyId, rawName) {
    const name = rawName.trim();
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await Department.findOne({ institutionId, facultyId, name });
    if (existing) return existing;

    return await Department.create({ institutionId, facultyId, name, slug });
  }

  /**
   * Normalizes, validates, and imports a Program (Course) under a Department.
   */
  static async ingestProgram(programData) {
    const name = programData.name.trim();
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const normalized = {
      institutionId: programData.institutionId,
      facultyId: programData.facultyId,
      departmentId: programData.departmentId,
      name,
      slug,
      duration: programData.duration || "4 years",
      cutoffMark: Number(programData.cutoffMark) || 200,
      tuition: programData.tuition || "₦150,000/yr",
      requirements: programData.requirements || ["Mathematics", "English"],
      careerPaths: programData.careerPaths || [],
      description: programData.description || `Specialized ${name} program leading to standard certifications.`,
    };

    // Deduplication check: unique name under the same department
    const existing = await Program.findOne({
      departmentId: normalized.departmentId,
      name: normalized.name,
    });

    if (existing) return existing;

    return await Program.create(normalized);
  }
}
