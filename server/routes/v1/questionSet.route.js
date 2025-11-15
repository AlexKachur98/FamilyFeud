import { Router } from 'express';
import {
  getAllQuestionSets,
  getQuestionSet,
  createQuestionSet,
  updateQuestionSet,
  addQuestionToSet,
  removeQuestionFromSet,
  deleteQuestionSet
} from '../../controllers/questionSet.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', getAllQuestionSets);
router.get('/:id', getQuestionSet);

// Protected routes (require authentication)
router.post('/', authMiddleware.requireSignin, createQuestionSet);
router.put('/:id', authMiddleware.requireSignin, updateQuestionSet);
router.post('/:id/questions', authMiddleware.requireSignin, addQuestionToSet);
router.delete('/:id/questions', authMiddleware.requireSignin, removeQuestionFromSet);
router.delete('/:id', authMiddleware.requireSignin, deleteQuestionSet);

export default router;
