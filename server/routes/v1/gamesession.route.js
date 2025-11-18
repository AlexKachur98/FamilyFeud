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
  endRound,
  deleteGameSession,
  updatePlayerReady,
  startSession,
  playerJoin,
  playerLeave
} from '../../controllers/gameSession.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

export default Router()

  // Public routes
  .get('/:id', getGameSession)

  // Protected routes
  .post('/', authMiddleware.requireSignin, createGameSession)
  .post('/:id/start', authMiddleware.requireSignin, startSession)
  .post('/:id/player-join', authMiddleware.requireSignin, playerJoin)
  .post('/:id/player-leave', authMiddleware.requireSignin, playerLeave)
  .put('/:id', authMiddleware.requireSignin, updateGameSession)
  .delete('/:id', authMiddleware.requireSignin, deleteGameSession)
  .post('/:id/round', authMiddleware.requireSignin, startRound)
  .put('/:id/team/:teamId', authMiddleware.requireSignin, updateTeam)
  .put('/:id/player/:playerId/ready', authMiddleware.requireSignin, updatePlayerReady)
  .post('/:id/reveal-answer', authMiddleware.requireSignin, revealAnswer)
  .post('/:id/team/:teamId/add-strike', authMiddleware.requireSignin, addStrike)
  .post('/:id/team/:teamId/award-points', authMiddleware.requireSignin, awardPoints)
  .post('/:id/end-round', authMiddleware.requireSignin, endRound)

  // Admin-only routes rethink or refactor
  .get('/', authMiddleware.requireSignin, /*authMiddleware.hasAuthorization,*/ getAllGameSessions)
