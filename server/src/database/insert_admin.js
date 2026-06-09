import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/userModel.js";

dotenv.config({ path: "../../.env" });

const patchAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not found in environment variables.");
    }

    console.log("Connecting to database...");
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected successfully to DB.");

    const existingAdmin = await User.findOne({ email: "hennycolour@gmail.com" });
    if (existingAdmin) {
      console.log("Admin hennycolour@gmail.com already exists. Updating password...");
      existingAdmin.password = "Lasustech123@";
      await existingAdmin.save();
      console.log("Password updated successfully.");
    } else {
      console.log("Creating new admin hennycolour@gmail.com...");
      await User.create({
        fullName: "Henny Colour",
        email: "hennycolour@gmail.com",
        password: "Lasustech123@",
        role: "admin",
      });
      console.log("New admin created successfully.");
    }

    console.log("Database patch complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error patching database:", error.message);
    process.exit(1);
  }
};

patchAdmin();
