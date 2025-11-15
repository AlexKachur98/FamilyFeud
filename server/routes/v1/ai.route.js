import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import aiController from '../../controllers/ai.controller.js';

const router = express.Router();

// Protected routes
router.post('/:questionId', authMiddleware.requireSignin, aiController.getAiResponse);

export default router;