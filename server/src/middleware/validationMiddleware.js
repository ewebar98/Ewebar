import { z } from "zod";

// Centralized validation wrapper
export const validate = (schema) => (req, res, next) => {
  try {
    // Validate request body, query, and params against the provided schema
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Replace request parts with validated and parsed inputs safely
    if (parsed.body) {
      req.body = parsed.body;
    }
    if (parsed.query) {
      for (const key in req.query) {
        delete req.query[key];
      }
      Object.assign(req.query, parsed.query);
    }
    if (parsed.params) {
      for (const key in req.params) {
        delete req.params[key];
      }
      Object.assign(req.params, parsed.params);
    }

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      const errors = error.errors.map((e) => `${e.path.slice(1).join(".")}: ${e.message}`);
      return next(new Error(`Validation failed: ${errors.join(", ")}`));
    }
    next(error);
  }
};

// 1. User Registration Schema
export const registerSchema = z.object({
  body: z.object({
    fullName: z
      .string({ required_error: "Full name is required" })
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .email("Please provide a valid email address"),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one capital letter")
      .regex(/[a-z]/, "Password must contain at least one small letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  }),
});

// 2. User Login Schema
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Please provide a valid email address"),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password cannot be empty"),
  }),
});

// 3. User Profile Update Schema
export const profileUpdateSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters")
      .optional(),
    jambRegNo: z
      .string()
      .regex(/^(19|20)\d{2}\d{4,8}[A-Z]{2}$/i, "JAMB Registration Number must start with a 4-digit registration year, followed by 4 to 8 digits, and end with 2 letters (e.g. 20261234AB or 202330639047FF)")
      .optional()
      .or(z.literal("")),
    jambCandidateName: z.string().optional().or(z.literal("")),
    jambDateOfBirth: z.string().optional().or(z.literal("")),
    jambGender: z.string().optional().or(z.literal("")),
    jambExamNo: z.string().optional().or(z.literal("")),
    jambScore: z
      .number()
      .min(0, "JAMB score cannot be negative")
      .max(400, "Maximum JAMB score is 400")
      .optional(),
    interests: z
      .array(z.string().min(1, "Interest cannot be an empty string"))
      .max(20, "Cannot add more than 20 interests")
      .optional(),
    preferredLocation: z
      .string()
      .max(100, "Preferred location is too long")
      .optional(),
    stateOfOrigin: z.string().optional(),
    lga: z.string().optional(),
    preferredCourse: z.string().optional(),
    bio: z.string().optional(),
    subjects: z.array(z.any()).optional(),
    jambSubjects: z.array(z.any()).optional(),
    olevelSittings: z.array(z.any()).optional(),
  }),
});
