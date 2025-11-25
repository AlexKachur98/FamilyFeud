import express from 'express';

import authMiddleware from '../../middlewares/auth.middleware.js';
import questionController from '../../controllers/question.controller.js';

const router = express.Router();

// Protected routes
router.get('/random', questionController.getRandomQuestion);
router.get('/all/:id', questionController.getQuestion);

// Authorization middleware to ensure user can only modify their own questions
router.get('/all', authMiddleware.requireSignin, authMiddleware.hasAuthorization, questionController.getAllQuestions);
router.post('/', authMiddleware.requireSignin, authMiddleware.hasAuthorization, questionController.createQuestion);
router.put('/:id', authMiddleware.requireSignin, authMiddleware.hasAuthorization, questionController.updateQuestion);
router.delete('/:id', authMiddleware.requireSignin, authMiddleware.hasAuthorization, questionController.deleteQuestion);

export default router;