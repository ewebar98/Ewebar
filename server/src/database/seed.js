import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import { University, Course } from "../models/universityModel.js";
import { Scholarship, Application } from "../models/scholarshipModel.js";
import Recommendation from "../models/recommendationModel.js";

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
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

    // Clear existing data
    console.log("Clearing existing database collections...");
    await User.deleteMany({});
    await University.deleteMany({});
    await Course.deleteMany({});
    await Scholarship.deleteMany({});
    await Application.deleteMany({});
    await Recommendation.deleteMany({});

    console.log("Database cleared.");

    // 1. Seed Universities
    console.log("Seeding universities...");
    const unis = [
      { name: "University of Lagos", location: "Lagos, Lagos State", ranking: 1, logo: "🎓", description: "Leading federal research university situated at the heart of Lagos." },
      { name: "University of Ibadan", location: "Ibadan, Oyo State", ranking: 2, logo: "🦁", description: "Nigeria's premier university, globally recognized for research." },
      { name: "Obafemi Awolowo University", location: "Ile-Ife, Osun State", ranking: 3, logo: "🌿", description: "Renowned for its architectural masterclass, beautiful campus, and strong engineering." },
      { name: "Covenant University", location: "Ota, Ogun State", ranking: 4, logo: "📚", description: "Top-ranked private university focusing on Christian leadership and technology." },
      { name: "University of Nigeria, Nsukka", location: "Nsukka, Enugu State", ranking: 5, logo: "🦁", description: "Distinguished federal university with strong roots in agricultural and arts sciences." },
      { name: "Ahmadu Bello University", location: "Zaria, Kaduna State", ranking: 6, logo: "🏛️", description: "Largest federal university in West Africa with an elite engineering legacy." },
      { name: "University of Benin", location: "Benin City, Edo State", ranking: 7, logo: "🐆", description: "Elite federal institution boasting powerful medicine and technology programs." },
      { name: "University of Ilorin", location: "Ilorin, Kwara State", ranking: 8, logo: "⚡", description: "Highly sought-after federal university celebrated for its ultra-stable academic calendar." },
      { name: "Lagos State University", location: "Ojo, Lagos State", ranking: 9, logo: "🏢", description: "Nigeria's leading state university specializing in law, arts, and management." },
      { name: "Federal University of Technology, Akure", location: "Akure, Ondo State", ranking: 10, logo: "⚙️", description: "Premier federal technological institution in southern Nigeria." },
      { name: "Federal University of Technology, Minna", location: "Minna, Niger State", ranking: 11, logo: "🛰️", description: "Key national hub for aviation technology, computing, and geosciences." },
      { name: "University of Port Harcourt", location: "Port Harcourt, Rivers State", ranking: 12, logo: "🌊", description: "Outstanding center for petroleum engineering, medicine, and human humanities." },
      { name: "Bayero University Kano", location: "Kano, Kano State", ranking: 13, logo: "🕌", description: "Highly respected federal university leading northern commerce and engineering education." },
      { name: "Federal University of Technology, Owerri", location: "Owerri, Imo State", ranking: 14, logo: "🔩", description: "Renowned premier federal technology university in southeast Nigeria." },
      { name: "University of Calabar", location: "Calabar, Cross River State", ranking: 15, logo: "🌴", description: "Scenic and historical federal university focusing on forestry and medical sciences." },
      { name: "University of Uyo", location: "Uyo, Akwa Ibom State", ranking: 16, logo: "🌾", description: "Vibrant federal university situated in the oil-rich Akwa Ibom hub." },
      { name: "University of Abuja", location: "Gwagwalada, FCT", ranking: 17, logo: "🏛️", description: "The federal capital's premier university with strong public administration." },
      { name: "Nnamdi Azikiwe University", location: "Awka, Anambra State", ranking: 18, logo: "🦅", description: "Proudly named after Nigeria's first president, leading in business and engineering." },
      { name: "Federal University of Agriculture, Abeokuta", location: "Abeokuta, Ogun State", ranking: 19, logo: "🌱", description: "Nigeria's elite federal agro-sciences and biotech university." },
      { name: "Abubakar Tafawa Balewa University", location: "Bauchi, Bauchi State", ranking: 20, logo: "⚒️", description: "Specialized technology university catering to northeast development." },
      { name: "Ladoke Akintola University of Technology", location: "Ogbomoso, Oyo State", ranking: 21, logo: "⚙️", description: "High-flying state-owned technology hub with rich engineering roots." },
      { name: "Pan-Atlantic University", location: "Lekki, Lagos State", ranking: 22, logo: "💼", description: "Prestigious private institution renowned for business, communications, and media." },
      { name: "Olabisi Onabanjo University", location: "Ago-Iwoye, Ogun State", ranking: 23, logo: "💡", description: "Dynamic state-owned university offering rich liberal arts and medical programs." },
      { name: "Delta State University", location: "Abraka, Delta State", ranking: 24, logo: "💧", description: "Top state university located by the serene Abraka river." },
      { name: "Kaduna State University", location: "Kaduna, Kaduna State", ranking: 25, logo: "🌇", description: "Leading state-owned university serving northern tech and business development." },
      { name: "Rivers State University", location: "Port Harcourt, Rivers State", ranking: 26, logo: "🏗️", description: "Elite state university specializing in science and technology innovation." },
      { name: "Kwara State University", location: "Malete, Kwara State", ranking: 27, logo: "🏜️", description: "Fast-growing state university with strong tech and entrepreneurship hubs." },
      { name: "Ekiti State University", location: "Ado-Ekiti, Ekiti State", ranking: 28, logo: "🏔️", description: "Top state university known for public policy, law, and agricultural sciences." },
      { name: "Adekunle Ajasin University", location: "Akungba-Akoko, Ondo State", ranking: 29, logo: "🍂", description: "One of Nigeria's highest-ranked state universities, praised for academic integrity." },
      { name: "Abia State University", location: "Uturu, Abia State", ranking: 30, logo: "🎖️", description: "Respected state institution focusing on medicine, optometry, and law." },
      { name: "Babcock University", location: "Ilishan-Remo, Ogun State", ranking: 31, logo: "⛪", description: "World-class private Adventist university leading in medical and computer sciences." },
      { name: "Landmark University", location: "Omu-Aran, Kwara State", ranking: 32, logo: "🚜", description: "Agrarian private university driving Nigeria's agricultural revolution." },
      { name: "Afe Babalola University", location: "Ado-Ekiti, Ekiti State", ranking: 33, logo: "🏥", description: "Ranked among the world's top private colleges, featuring a premier teaching hospital." },
      { name: "Nile University of Nigeria", location: "Abuja, FCT", ranking: 34, logo: "🏙️", description: "Premium private university in the capital, affiliated with Honoris United Universities." },
      { name: "American University of Nigeria", location: "Yola, Adamawa State", ranking: 35, logo: "🇺🇸", description: "Elite private liberal-arts college with international curriculum and tech programs." },
      { name: "Bells University of Technology", location: "Ota, Ogun State", ranking: 36, logo: "🔔", description: "Nigeria's premier private technology-focused university." },
      { name: "Lead City University", location: "Ibadan, Oyo State", ranking: 37, logo: "🏙️", description: "Dynamic private college specializing in enterprise management and computer sciences." },
      { name: "Bowen University", location: "Iwo, Osun State", ranking: 38, logo: "📜", description: "Prestigious Baptist private university known for peaceful learning and strong sciences." },
      { name: "Federal University, Oye-Ekiti", location: "Oye, Ekiti State", ranking: 39, logo: "🌄", description: "Fastest-growing federal university situated in the hills of Ekiti." },
      { name: "Enugu State University of Science and Technology", location: "Enugu, Enugu State", ranking: 40, logo: "🚂", description: "Pioneering state-owned technological university in eastern Nigeria." }
    ];
    const seededUnis = await University.insertMany(unis);
    console.log(`Seeded ${seededUnis.length} universities.`);

    // Map by name for easy linking
    const uniMap = {};
    seededUnis.forEach(u => {
      uniMap[u.name] = u;
    });

    // 2. Seed Courses for each university
    console.log("Seeding courses...");
    const courses = [];
    const courseNames = [
      { name: "Computer Science", faculty: "Sciences", cutoffMark: 240, slotsAvailable: 120, requiredSubjects: ["Mathematics", "English", "Physics", "Chemistry"] },
      { name: "Medicine & Surgery", faculty: "Medical Sciences", cutoffMark: 280, slotsAvailable: 60, requiredSubjects: ["Biology", "English", "Physics", "Chemistry"] },
      { name: "Mechanical Engineering", faculty: "Engineering", cutoffMark: 250, slotsAvailable: 95, requiredSubjects: ["Mathematics", "English", "Physics", "Chemistry"] },
      { name: "Business Administration", faculty: "Management Sciences", cutoffMark: 220, slotsAvailable: 100, requiredSubjects: ["Mathematics", "English", "Economics", "Government"] },
      { name: "Law", faculty: "Law", cutoffMark: 260, slotsAvailable: 80, requiredSubjects: ["Literature", "English", "Government", "CRK/IRK"] }
    ];

    // Seed courses across all universities
    for (const uni of seededUnis) {
      for (const c of courseNames) {
        courses.push({
          universityId: uni._id,
          courseName: c.name,
          cutoffMark: c.cutoffMark,
          slotsAvailable: c.slotsAvailable,
          requiredSubjects: c.requiredSubjects
        });
      }
    }
    const seededCourses = await Course.insertMany(courses);
    console.log(`Seeded ${seededCourses.length} courses across universities.`);

    // 3. Seed Scholarships
    console.log("Seeding scholarships...");
    const scholarships = [
      { title: "MTN Foundation Scholarship", eligibility: "JAMB ≥ 250, Sciences", deadline: new Date("2026-08-15"), coverage: "₦600,000", category: "Merit" },
      { title: "Shell Nigeria Bursary", eligibility: "Engineering, GPA ≥ 4.0", deadline: new Date("2026-06-30"), coverage: "₦1,200,000", category: "STEM" },
      { title: "NNPC/Total National Merit", eligibility: "Nigerian, JAMB ≥ 260", deadline: new Date("2026-07-20"), coverage: "₦800,000", category: "Merit" },
      { title: "Agbami Medical Scholarship", eligibility: "Medicine, Year 2+", deadline: new Date("2026-09-01"), coverage: "₦500,000", category: "Need" },
      { title: "Google Africa Developer Scholarship", eligibility: "18+, Coding", deadline: new Date("2026-05-25"), coverage: "Free training", category: "Tech" },
    ];
    const seededScholarships = await Scholarship.insertMany(scholarships);
    console.log(`Seeded ${seededScholarships.length} scholarships.`);

    // 4. Seed a Demo User (Ada Eze)
    console.log("Seeding demo student user...");
    const demoUser = await User.create({
      fullName: "Ada Eze",
      email: "ada.eze@example.com",
      password: "password123", // Will be hashed automatically by userModel pre-save hook
      role: "student",
      jambScore: 268,
      interests: ["AI", "Robotics", "Design", "Entrepreneurship"],
      preferredLocation: "Lagos",
    });
    console.log(`Seeded demo student: ${demoUser.fullName} (${demoUser.email})`);

    // Seed a Demo Admin
    console.log("Seeding demo admin user...");
    const demoAdmin = await User.create({
      fullName: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
    });
    console.log(`Seeded demo admin: ${demoAdmin.fullName} (${demoAdmin.email})`);

    // Seed Henny Admin
    console.log("Seeding Henny admin user...");
    const hennyAdmin = await User.create({
      fullName: "Henny Colour",
      email: "hennycolour@gmail.com",
      password: "Lasustech123@",
      role: "admin",
    });
    console.log(`Seeded Henny admin: ${hennyAdmin.fullName} (${hennyAdmin.email})`);

    // 5. Seed Recommendations for Demo User
    console.log("Seeding recommendations...");
    const unilag = uniMap["University of Lagos"];
    const covenant = uniMap["Covenant University"];
    const oau = uniMap["Obafemi Awolowo University"];
    const ui = uniMap["University of Ibadan"];

    // Find course IDs
    const findCourseId = (uniId, courseName) => {
      const found = seededCourses.find(c => c.universityId.toString() === uniId.toString() && c.courseName === courseName);
      return found ? found._id : null;
    };

    const recCourses = [
      {
        courseId: findCourseId(unilag._id, "Computer Science"),
        matchPercentage: 94,
        explanation: "Your JAMB score (268) and strong Math grade align well. UNILAG CS has a 91% graduation rate and high industry placement."
      },
      {
        courseId: findCourseId(covenant._id, "Computer Science"),
        matchPercentage: 88,
        explanation: "Excellent fit based on your academic and aptitude profile. Covenant offers strong tech mentorship and modern facilities."
      },
      {
        courseId: findCourseId(oau._id, "Mechanical Engineering"),
        matchPercentage: 82,
        explanation: "Your Physics score and engineering interest match OAU's engineering program strengths."
      },
      {
        courseId: findCourseId(ui._id, "Medicine & Surgery"),
        matchPercentage: 71,
        explanation: "Your score is highly competitive but tight for UI Medicine; consider strengthening Biology prep."
      }
    ].filter(r => r.courseId !== null);

    await Recommendation.create({
      userId: demoUser._id,
      recommendedCourses: recCourses,
      matchPercentage: 89
    });
    console.log(`Seeded recommendation for ${demoUser.fullName}.`);

    // 6. Seed Applications
    console.log("Seeding applications...");
    const demoApplications = [
      {
        studentId: demoUser._id,
        universityId: unilag._id,
        courseId: findCourseId(unilag._id, "Computer Science"),
        status: "reviewed",
        matchScore: 92
      },
      {
        studentId: demoUser._id,
        universityId: covenant._id,
        courseId: findCourseId(covenant._id, "Computer Science"),
        status: "accepted",
        matchScore: 88
      },
      {
        studentId: demoUser._id,
        universityId: oau._id,
        courseId: findCourseId(oau._id, "Mechanical Engineering"),
        status: "pending",
        matchScore: 80
      }
    ].filter(app => app.courseId !== null);

    const seededApps = await Application.insertMany(demoApplications);
    console.log(`Seeded ${seededApps.length} applications.`);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedData();
