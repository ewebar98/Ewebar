/**
 * Validates that all required environment variables are present and correctly formatted.
 * Exits the process immediately if critical variables are missing.
 */
export const validateEnvironment = () => {
  const requiredVars = [
    { name: "MONGO_URI", critical: true },
    { name: "JWT_SECRET", critical: true },
    { name: "GROQ_API_KEY", critical: false }, // Critical for AI only, will use offline fallback if missing
  ];

  const missing = [];
  const warnings = [];

  for (const variable of requiredVars) {
    const value = process.env[variable.name];
    if (!value || value.trim() === "") {
      if (variable.critical) {
        missing.push(variable.name);
      } else {
        warnings.push(variable.name);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(`\x1b[33m[Warning] Missing non-critical environment variables: ${warnings.join(", ")}\x1b[0m`);
    console.warn("\x1b[33mAI counseling services will operate with standard offline fallbacks.\x1b[0m");
  }

  if (missing.length > 0) {
    console.error("\x1b[31m[Critical Error] Missing required configuration environment variables:\x1b[0m");
    for (const name of missing) {
      console.error(`\x1b[31m  - ${name}\x1b[0m`);
    }
    console.error("\x1b[31mServer startup aborted. Please define these variables inside server/.env\x1b[0m");
    process.exit(1);
  }

  console.log("\x1b[32m[Startup] All required configuration keys are successfully loaded.\x1b[32m\x1b[0m");
};
