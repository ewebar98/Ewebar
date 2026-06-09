import asyncHandler from '../utils/asyncHandler.js';
import AdmissionRule from '../models/admissionRuleModel.js';
import AuditLog from '../models/auditLogModel.js';
import eventBus from '../utils/eventBus.js';

// @desc    List all admission rules
// @route   GET /api/admin/rules
// @access  Private/Admin
export const listRules = asyncHandler(async (req, res) => {
  const rules = await AdmissionRule.find({}).sort({ createdAt: -1 });
  res.json({ success: true, message: 'Admission rules fetched', data: rules });
});

// @desc    Create a new admission rule
// @route   POST /api/admin/rules
// @access  Private/Admin
export const createRule = asyncHandler(async (req, res) => {
  const { name, description, criteria, active } = req.body;
  if (!name || !criteria) {
    res.status(400);
    throw new Error('Name and criteria are required');
  }
  const rule = await AdmissionRule.create({
    name,
    description,
    criteria,
    active: active ?? true,
    createdBy: req.user.id,
  });

  await AuditLog.create({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'RULE_CREATED',
    entityName: 'AdmissionRule',
    entityId: rule._id,
    previousState: null,
    newState: rule,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || '',
  });
  eventBus.emit('RULE_CHANGED', { ruleId: rule._id });

  res.status(201).json({ success: true, message: 'Admission rule created', data: rule });
});

// @desc    Update an admission rule
// @route   PUT /api/admin/rules/:id
// @access  Private/Admin
export const updateRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rule = await AdmissionRule.findById(id);
  if (!rule) {
    res.status(404);
    throw new Error('Admission rule not found');
  }
  const previous = rule.toObject();
  const { name, description, criteria, active } = req.body;
  if (name !== undefined) rule.name = name;
  if (description !== undefined) rule.description = description;
  if (criteria !== undefined) rule.criteria = criteria;
  if (active !== undefined) rule.active = active;

  await rule.save();

  await AuditLog.create({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'RULE_UPDATED',
    entityName: 'AdmissionRule',
    entityId: rule._id,
    previousState: previous,
    newState: rule,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || '',
  });
  eventBus.emit('RULE_CHANGED', { ruleId: rule._id });

  res.json({ success: true, message: 'Admission rule updated', data: rule });
});

// @desc    Delete an admission rule
// @route   DELETE /api/admin/rules/:id
// @access  Private/Admin
export const deleteRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rule = await AdmissionRule.findById(id);
  if (!rule) {
    res.status(404);
    throw new Error('Admission rule not found');
  }
  const previous = rule.toObject();
  await rule.deleteOne();

  await AuditLog.create({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'RULE_DELETED',
    entityName: 'AdmissionRule',
    entityId: rule._id,
    previousState: previous,
    newState: null,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || '',
  });
  eventBus.emit('RULE_CHANGED', { ruleId: rule._id });

  res.json({ success: true, message: 'Admission rule deleted' });
});
