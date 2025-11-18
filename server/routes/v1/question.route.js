import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import questionController from '../../controllers/question.controller.js';

const router = express.Router();

// Protected routes
router.get('/all', questionController.getAllQuestions);
router.get('/', questionController.getRandomQuestion);
router.get('/:id', questionController.getQuestion);
router.post('/', questionController.createQuestion);

// Authorization middleware to ensure user can only modify their own questions
router.put('/:id', authMiddleware.requireSignin, authMiddleware.hasAuthorization, questionController.updateQuestion);
router.delete('/:id', authMiddleware.requireSignin, authMiddleware.hasAuthorization, questionController.deleteQuestion);

export default router;
