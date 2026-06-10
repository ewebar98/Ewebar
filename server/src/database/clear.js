import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import { University, Course } from "../models/universityModel.js";
import { Scholarship } from "../models/scholarshipModel.js";
import { Application } from "../models/applicationModel.js";
import Recommendation from "../models/recommendationModel.js";

dotenv.config();

const clearDatabase = async () => {
  try {
    let conn;
    try {
      console.log("Connecting to primary database...");
      conn = await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      console.log(`Connected to primary database: ${conn.connection.db.databaseName}`);
    } catch (err) {
      console.warn(`Primary database connection failed: ${err.message}. Trying fallback...`);
      conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/webar", { serverSelectionTimeoutMS: 5000 });
      console.log(`Connected to fallback database: ${conn.connection.db.databaseName}`);
    }

    console.log("Clearing all existing database collections (removing dummy data)...");
    await User.deleteMany({});
    await University.deleteMany({});
    await Course.deleteMany({});
    await Scholarship.deleteMany({});
    await Application.deleteMany({});
    await Recommendation.deleteMany({});

    console.log("Database cleared successfully! All dummy data is removed.");
    process.exit(0);
  } catch (error) {
    console.error("Error during database clearance:", error);
    process.exit(1);
  }
};

clearDatabase();
