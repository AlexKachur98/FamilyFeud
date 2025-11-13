import express from 'express';
import questionController from '../controllers/question.controller.js';

const router = express.Router();

router.get('/api/questions', questionController.getAllQuestions);
router.get('/api/questions/:id', questionController.getQuestion);
router.post('/api/questions', questionController.createQuestion);

export default router;