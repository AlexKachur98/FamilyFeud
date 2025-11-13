import express from 'express';
import questionController from '../../controllers/question.controller.js';

const router = express.Router();

// router.get('/api/questions', questionController.getAllQuestions);
router.get('/', questionController.getRandomQuestion);
router.get('/:id', questionController.getQuestion);
router.post('/', questionController.createQuestion);

export default router;