import { Router } from 'express';
import {
  createGameSession,
  getGameSession,
  updateGameSession,
  startRound,
  updateTeam,
  getAllGameSessions,
  revealAnswer,
  addStrike,
  awardPoints,
  endRound
} from '../../controllers/gameSession.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

export default Router()

  // Public routes
  .get('/:id', getGameSession)

  // Protected routes
  .post('/', authMiddleware.requireSignin, createGameSession)
  .put('/:id', authMiddleware.requireSignin, updateGameSession)
  .post('/:id/round', authMiddleware.requireSignin, startRound)
  .put('/:id/team/:teamId', authMiddleware.requireSignin, updateTeam)
  .post('/:id/reveal-answer', authMiddleware.requireSignin, revealAnswer)
  .post('/:id/team/:teamId/add-strike', authMiddleware.requireSignin, addStrike)
  .post('/:id/team/:teamId/award-points', authMiddleware.requireSignin, awardPoints)
  .post('/:id/end-round', authMiddleware.requireSignin, endRound)

  // Admin-only routes
  .get('/', authMiddleware.requireSignin, authMiddleware.hasAuthorization, getAllGameSessions)

