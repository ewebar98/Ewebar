import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true }, // e.g., USER_PROFILE_UPDATE, RULE_CHANGED, CAPACITY_UPDATED, RECOMMENDATION_GENERATED
  entityName: { type: String, required: true }, // e.g., User, Program, Application
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  previousState: { type: mongoose.Schema.Types.Mixed },
  newState: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
