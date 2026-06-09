import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import { listRules, createRule, updateRule, deleteRule } from '../controllers/admissionRuleController.js';

const router = express.Router();

router.get('/rules', protect, adminOnly, asyncHandler(listRules));
router.post('/rules', protect, adminOnly, asyncHandler(createRule));
router.put('/rules/:id', protect, adminOnly, asyncHandler(updateRule));
router.delete('/rules/:id', protect, adminOnly, asyncHandler(deleteRule));

export default router;
