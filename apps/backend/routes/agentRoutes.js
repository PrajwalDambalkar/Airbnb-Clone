// routes/agentRoutes.js
import express from 'express';
import { createPlan, chat } from '../controllers/agentController.js';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Please login'
    });
  }
  next();
};

// POST /api/agent/plan - Generate travel plan for a booking
router.post('/plan', requireAuth, createPlan);

// POST /api/agent/chat - Conversational AI assistant
router.post('/chat', requireAuth, chat);

export default router;

