import mongoose from 'mongoose';

const admissionRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  criteria: { type: mongoose.Schema.Types.Mixed, required: true }, // JSON object defining rule logic
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const AdmissionRule = mongoose.model('AdmissionRule', admissionRuleSchema);
export default AdmissionRule;
