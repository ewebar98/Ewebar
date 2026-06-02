import mongoose from "mongoose";
import dns from "node:dns";

const connectDB = async () => {
  // Force process-level public DNS resolvers to resolve MONGODB_URI SRV records successfully,
  // bypassing any querySrv ECONNREFUSED blocks from local ISP or network DNS limitations.
  try {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
  } catch (dnsErr) {
    console.warn("[DNS Resolution Warning] Failed to set public DNS servers:", dnsErr.message);
  }

  const uri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/intellipath";

  try {
    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables.");
    }

    // Mask sensitive credentials in URI for safe logging
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
    console.log(`Connecting to primary MongoDB Atlas at: ${maskedUri}`);

    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected successfully to primary!`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.warn(`Primary MongoDB Connection failed: ${error.message}`);
    console.log(`Attempting fallback to local database...`);
    try {
      const conn = await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB Connected successfully to fallback database!`);
      console.log(`Host: ${conn.connection.host}`);
      console.log(`Database: ${conn.connection.name}`);
    } catch (fallbackError) {
      console.error(`Fallback MongoDB Connection Error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
