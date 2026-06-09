import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please add a full name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "admin", "staff", "manager", "customerCare", "schoolAdmin"],
      default: "student",
    },
    category: {
      type: String,
      enum: ["student", "staff", "management"],
      default: "student",
    },
    createdByAdmin: {
      type: Boolean,
      default: false,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    jambScore: {
      type: Number,
      default: 0,
    },
    jambRegNo: {
      type: String,
      default: "",
    },
    jambCandidateName: {
      type: String,
      default: "",
    },
    jambDateOfBirth: {
      type: String,
      default: "",
    },
    jambGender: {
      type: String,
      default: "",
    },
    jambExamNo: {
      type: String,
      default: "",
    },
    jambResultSlip: {
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      name: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    interests: [String],
    preferredLocation: String,
    stateOfOrigin: {
      type: String,
      default: "",
    },
    lga: {
      type: String,
      default: "",
    },
    preferredCourse: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    subjects: [
      {
        name: String,
        grade: String,
      },
    ],
    jambSubjects: [
      {
        name: String,
        score: Number,
      },
    ],
    olevelSittings: [
      {
        sittingNumber: Number,
        examType: String, // WAEC, NECO, NABTEB, GCE
        examYear: String,
        sittingType: String, // May/June, Nov/Dec, Internal, External
        candidateFullName: String,
        dateOfBirth: String,
        gender: String,
        examNumber: String,
        candidateNumber: String,
        centerNumber: String,
        schoolNumber: String,
        registrationNumber: String,
        serialNumber: String,
        pin: String,
        resultSlip: {
          _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
          name: String,
          url: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
        subjects: [
          {
            name: String,
            grade: String,
          },
        ],
      },
    ],
    uploadedDocuments: [
      {
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
