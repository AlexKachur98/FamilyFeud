import express from 'express';
import aiController from '../controllers/ai.controller.js';
// import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Add middleware once authentication and user is finished
router.post('/api/ai', aiController.getAiResponse);

export default router;