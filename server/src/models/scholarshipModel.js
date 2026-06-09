import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a scholarship name"],
    },
    sponsor: {
      type: String,
      required: [true, "Please add a sponsor"],
    },
    amount: {
      type: String,
      required: [true, "Please add an amount"],
    },
    deadline: {
      type: Date,
      required: [true, "Please add a deadline"],
    },
    category: {
      type: String,
      required: [true, "Please add a category"],
    },
    eligibility: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Map _id to id
scholarshipSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Scholarship = mongoose.model("Scholarship", scholarshipSchema);
