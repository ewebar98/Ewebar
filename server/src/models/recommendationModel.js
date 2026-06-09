import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recommendedCourses: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Program",
        },
        matchPercentage: Number,
        explanation: String,
        breakdown: [
          {
            type: { type: String, enum: ["PASS", "FAIL", "WARN"] },
            field: String,
            message: String,
          }
        ],
        confidence: { type: String, default: "Medium" },
        recourseActions: [
          {
            code: String,
            type: { type: String },
            message: String,
            actionLink: String,
          }
        ],
      },
    ],
    matchPercentage: Number, // Overall profile match
  },
  {
    timestamps: true,
  }
);

const Recommendation = mongoose.model("Recommendation", recommendationSchema);

export default Recommendation;
