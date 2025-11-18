import ActiveSessionModel from '../models/activeSession.model.js';
import QuestionModel from '../models/question.model.js';
import { ROUND_BUCKETS } from './question.controller.js';
import { seedSessionLog, logSessionEvent } from '../utils/logger.js';
import GameLog from '../models/gameLog.model.js';
import { broadcastSession } from '../sockets/sessionBus.js';
import mongoose from 'mongoose';

const findTeamById = (session, teamId) =>
  session?.teams?.find((team) =>
    team?._id?.toString() === teamId || team?.id === teamId
  );

const findQuestionForRound = async (roundType) => {
  const roundBucket = ROUND_BUCKETS[roundType];
  if (!roundBucket) throw new Error('Invalid round type');
  const { minAnswers, maxAnswers } = roundBucket;
  const questionQuery = {};
  if (minAnswers) questionQuery['answers.' + (minAnswers - 1)] = { $exists: true };
  if (maxAnswers) questionQuery['answers.' + maxAnswers] = { $exists: false };

  let count = await QuestionModel.countDocuments(questionQuery);
  if (count === 0) throw new Error('No questions available for this round');

  const randomIndex = Math.floor(Math.random() * count);
  const question = await QuestionModel.findOne(questionQuery).skip(randomIndex);
  if (!question) throw new Error('Question not found');
  return question;
};

// Create a new game session
export const createGameSession = async (req, res) => {
  try {
    const { id, hostName, accessCode, questionSetId, teams, settings } = req.body;
    const hostId = req.auth?._id?.toString() || 'host';
    const hostLabel = req.user?.displayName || req.user?.username || hostName || 'Host';

    const baseTeams = Array.isArray(teams) && teams.length ? teams : [
      { id: 'team-a', name: 'Team A', players: [], ready: false, score: 0, strikes: 0 },
      { id: 'team-b', name: 'Team B', players: [], ready: false, score: 0, strikes: 0 }
    ];

    const normalizedTeams = (() => {
      const copy = baseTeams.map((team, index) => ({
        id: team.id || `team-${index + 1}`,
        name: team.name || `Team ${index + 1}`,
        players: Array.isArray(team.players) ? team.players : [],
        ready: Boolean(team.ready),
        score: Number(team.score) || 0,
        strikes: Number(team.strikes) || 0
      }));
      // ensure host is on a team
      if (!copy.some((t) => t.players?.some((p) => p.id === hostId))) {
        if (!copy[0]) {
          copy[0] = { id: 'team-a', name: 'Team A', players: [], ready: false, score: 0, strikes: 0 };
        }
        copy[0].players = [...(copy[0].players || []), { id: hostId, name: hostLabel, ready: false }];
      }
      return copy;
    })();

    const newSession = new ActiveSessionModel({
      id,
      hostName,
      hostUserId: hostId,
      accessCode,
      questionSetId,
      teams: normalizedTeams,
      status: 'lobby',
      settings: settings || {}
    });
    await newSession.save();
    await seedSessionLog(id, {
      hostId: req.auth?._id?.toString(),
      settings: settings || {},
      teams: normalizedTeams
    });
    await logSessionEvent(id, { event: 'SESSION_CREATED', actorId: req.auth?._id?.toString(), payload: { hostName, accessCode, questionSetId } });
    broadcastSession(id, newSession);
    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a game session by ID
export const getGameSession = async (req, res) => {
  try {
    const session = await ActiveSessionModel.findOne({ id: req.params.id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a game session
export const updateGameSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const session = await ActiveSessionModel.findOneAndUpdate(
      { id },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    await logSessionEvent(id, { event: 'SESSION_UPDATED', actorId: req.auth?._id?.toString(), payload: updates });
    broadcastSession(id, session);
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start a new round for a game session
export const startRound = async (req, res) => {
  try {
    const { id } = req.params;
    const { roundType } = req.body;
    const session = await ActiveSessionModel.findOne({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const question = await findQuestionForRound(roundType);

    session.currentRound += 1;
    session.status = 'in_progress';
    session.updatedAt = new Date();
    session.currentQuestionId = question._id.toString();
    session.currentQuestionText = question.question;
    session.currentQuestionSize = question.answers?.length ?? null;
    session.revealedAnswers = (question.answers || []).map((ans, idx) => ({
      index: idx,
      answer: ans.answer,
      points: ans.points,
      revealed: false
    }));
    session.controlTeamId = null;
    await session.save();
    await logSessionEvent(id, { event: 'ROUND_STARTED', actorId: req.auth?._id?.toString(), payload: { round: session.currentRound, questionId: question._id, roundType } });
    broadcastSession(id, session);

    res.status(200).json({
      session,
      question: {
        _id: question._id,
        question: question.question,
        size: question.answers.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start session and first round
export const startSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { roundType = '1' } = req.body;
    const session = await ActiveSessionModel.findOne({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    // enforce all players ready
    const allPlayersReady = session.teams.flatMap((t) => t.players || []).length > 0 &&
      session.teams.flatMap((t) => t.players || []).every((p) => p.ready);
    if (!allPlayersReady) return res.status(400).json({ message: 'All players must be ready before starting.' });

    const question = await findQuestionForRound(roundType);
    session.status = 'in_progress';
    session.currentRound = 1;
    session.currentQuestionId = question._id.toString();
    session.currentQuestionText = question.question;
    session.currentQuestionSize = question.answers?.length ?? null;
    session.revealedAnswers = (question.answers || []).map((ans, idx) => ({
      index: idx,
      answer: ans.answer,
      points: ans.points,
      revealed: false
    }));
    session.controlTeamId = null;
    session.updatedAt = new Date();
    await session.save();

    await logSessionEvent(id, { event: 'SESSION_STARTED', actorId: req.auth?._id?.toString(), payload: { roundType, questionId: question._id } });
    broadcastSession(id, session);

    res.status(200).json({
      session,
      question: {
        _id: question._id,
        question: question.question,
        size: question.answers.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update team score or strikes
export const updateTeam = async (req, res) => {
  try {
    const { id, teamId } = req.params;
    const { score, strikes, ready, name, players } = req.body;
    const session = await ActiveSessionModel.findOne({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const team = findTeamById(session, teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (score !== undefined) team.score = score;
    if (strikes !== undefined) team.strikes = strikes;
    if (ready !== undefined) team.ready = ready;
    if (name !== undefined) team.name = name;
    if (Array.isArray(players)) team.players = players;

    session.updatedAt = new Date();
    await session.save();
    await logSessionEvent(id, { event: 'TEAM_UPDATED', actorId: req.auth?._id?.toString(), payload: { teamId, score, strikes, ready, name, players } });
    broadcastSession(id, session);
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update player ready state (only that player)
export const updatePlayerReady = async (req, res) => {
  try {
    const { id, playerId } = req.params;
    const { ready } = req.body;
    const session = await ActiveSessionModel.findOne({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    let targetPlayer = null;
    session.teams?.forEach((team) => {
      team.players?.forEach((p) => {
        if (p.id === playerId || p._id?.toString() === playerId) targetPlayer = p;
      });
    });
    if (!targetPlayer) return res.status(404).json({ message: 'Player not found' });

    if (req.auth?._id?.toString() !== playerId && !req.user?.admin) {
      return res.status(403).json({ message: 'Not authorized to update this player' });
    }

    targetPlayer.ready = Boolean(ready);
    session.updatedAt = new Date();
    await session.save();
    await logSessionEvent(id, { event: 'PLAYER_READY_UPDATED', actorId: req.auth?._id?.toString(), payload: { playerId, ready: Boolean(ready) } });
    broadcastSession(id, session);
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all active game sessions (admin-only)
export const getAllGameSessions = async (req, res) => {
  try {
    const sessions = await ActiveSessionModel.find();
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a game session (lobby cancel)
export const deleteGameSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await ActiveSessionModel.findOneAndDelete({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    await logSessionEvent(id, { event: 'SESSION_DELETED', actorId: req.auth?._id?.toString(), payload: {} });
    await GameLog.deleteOne({ sessionId: id }).catch(() => {});
    broadcastSession(id, { deleted: true, id });
    res.status(200).json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Reveal next answer
export const revealAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { index } = req.body;
    const session = await ActiveSessionModel.findOne({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (typeof index !== 'number' || index < 0 || index >= (session.currentQuestionSize || 0)) {
      return res.status(400).json({ message: 'Invalid answer index' });
    }

    session.revealedAnswers = session.revealedAnswers || [];
    const target = session.revealedAnswers.find((a) => a.index === index);
    if (target) target.revealed = true;
    session.updatedAt = new Date();
    await session.save();

    await logSessionEvent(id, { event: 'ANSWER_REVEALED', actorId: req.auth?._id?.toString(), payload: { index } });
    broadcastSession(id, session);

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add strike
export const addStrike = async (req, res) => {
  try {
    const { id, teamId } = req.params;
    const session = await ActiveSessionModel.findOne({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const team = findTeamById(session, teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    team.strikes += 1;
    session.updatedAt = new Date();
    await session.save();

    await logSessionEvent(id, { event: 'STRIKE_ADDED', actorId: req.auth?._id?.toString(), payload: { teamId } });
    broadcastSession(id, session);
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const normalizeText = (value = '') => value.toString().trim().toLowerCase();

// Socket-compatible action handler
export const handleSocketAction = async ({
  action,
  type,
  sessionId,
  teamId,
  points,
  index,
  actorId,
  roundType,
  playerId,
  guess
}) => {
  const actionName = action || type;
  const session = await ActiveSessionModel.findOne({ id: sessionId });
  if (!session) throw new Error('Session not found');

  const isHost = !session.hostUserId || session.hostUserId === actorId;
  const isMember = session.teams?.some((t) => (t.players || []).some((p) => p.id === actorId));
  if (!isMember) throw new Error('Not a session participant');
  const hostOnly = new Set(['startRound', 'endRound']);
  if (hostOnly.has(actionName) && !isHost) {
    throw new Error('Host privileges required for this action');
  }

  if (actionName === 'strike' || actionName === 'addStrike') {
    const targetTeamId = teamId || session.controlTeamId;
    const team = findTeamById(session, targetTeamId);
    if (!team) throw new Error('Team not found');
    team.strikes = (team.strikes || 0) + 1;
  }

  if (actionName === 'awardPoints') {
    const team = findTeamById(session, teamId);
    if (!team) throw new Error('Team not found');
    team.score += Number(points) || 0;
  }

  if (actionName === 'setControl') {
    session.controlTeamId = teamId;
  }

  if (actionName === 'setActivePlayer') {
    session.activePlayerId = playerId || actorId || null;
  }

  if (actionName === 'buzz') {
    session.activePlayerId = actorId || null;
  }

  if (actionName === 'playPass') {
    if (teamId) session.controlTeamId = teamId;
    session.activePlayerId = playerId || actorId || session.activePlayerId;
  }

  if (actionName === 'revealAnswer') {
    session.revealedAnswers = session.revealedAnswers || [];
    if (typeof index === 'number' && index >= 0 && index < (session.currentQuestionSize || 0)) {
      session.revealedAnswers = session.revealedAnswers.map((entry) =>
        entry.index === index
          ? {
            ...entry,
            revealed: true,
            answer: entry.answer || guess || entry.answer,
            points: entry.points || points
          }
          : entry
      );
    }
  }

  if (actionName === 'submitGuess') {
    const cleaned = normalizeText(guess);
    if (!cleaned) throw new Error('Guess is required');
    const answers = session.revealedAnswers || [];
    const match = answers.find((ans) => normalizeText(ans.answer) === cleaned);
    if (match) {
      session.revealedAnswers = answers.map((entry) =>
        entry.index === match.index ? { ...entry, revealed: true } : entry
      );
    } else {
      const targetTeamId = teamId || session.controlTeamId;
      const team = findTeamById(session, targetTeamId);
      if (team) team.strikes = (team.strikes || 0) + 1;
    }
  }

  if (actionName === 'startRound') {
    // If roundType === '1', treat as a full restart/reset to round 1.
    const restarting = String(roundType) === '1';
    const derivedRound = roundType || String((session.currentRound || 0) + 1);
    const question = await findQuestionForRound(derivedRound);
    session.currentRound = restarting ? 1 : (session.currentRound || 0) + 1;
    session.status = 'in_progress';
    session.currentQuestionId = question._id.toString();
    session.currentQuestionText = question.question;
    session.currentQuestionSize = question.answers?.length ?? null;
    session.revealedAnswers = (question.answers || []).map((ans, idx) => ({
      index: idx,
      answer: ans.answer,
      points: ans.points,
      revealed: false
    }));
    session.controlTeamId = null;
    session.activePlayerId = null;
    if (restarting) {
      // Reset per-team state on full restart.
      session.teams = (session.teams || []).map((team) => ({
        ...team.toObject?.() || team,
        score: 0,
        strikes: 0,
        ready: false
      }));
      session.roundResult = null;
    }
  }

  if (actionName === 'endRound') {
    session.currentRound = (session.currentRound || 0) + 1;
    session.status = 'lobby';
    session.controlTeamId = null;
    session.activePlayerId = null;
  }

  session.updatedAt = new Date();
  await session.save();
  await logSessionEvent(sessionId, { event: `SOCKET_${(actionName || 'noop').toUpperCase()}`, actorId, payload: { teamId, points, index } });
  broadcastSession(sessionId, session);
  return session;
};

// Award points
export const awardPoints = async (req, res) => {
  try {
    const { id, teamId } = req.params;
    const { points } = req.body;
    const session = await ActiveSessionModel.findOne({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const team = findTeamById(session, teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    team.score += points;
    session.updatedAt = new Date();
    await session.save();

    await logSessionEvent(id, { event: 'POINTS_AWARDED', actorId: req.auth?._id?.toString(), payload: { teamId, points } });
    broadcastSession(id, session);
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// End round
export const endRound = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await ActiveSessionModel.findOne({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.currentRound += 1;
    session.status = 'lobby';
    session.updatedAt = new Date();
    await session.save();

    await logSessionEvent(id, { event: 'ROUND_ENDED', actorId: req.auth?._id?.toString(), payload: { round: session.currentRound } });
    broadcastSession(id, session);
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Player join
export const playerJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, teamId } = req.body;
    const session = await ActiveSessionModel.findOne({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    const playerId = req.auth?._id?.toString() || `guest-${Date.now()}`;
    const targetTeam = teamId ? findTeamById(session, teamId) : session.teams?.[0];
    if (!targetTeam) return res.status(400).json({ message: 'No team available' });

    // remove from any existing team first
    session.teams.forEach((team) => {
      team.players = (team.players || []).filter((p) => p.id !== playerId);
    });

    // prevent duplicate
    if (!targetTeam.players.some((p) => p.id === playerId)) {
      targetTeam.players.push({ id: playerId, name: name || 'Player', ready: false });
    }

    session.updatedAt = new Date();
    await session.save();
    await logSessionEvent(id, { event: 'PLAYER_JOINED', actorId: playerId, payload: { teamId: targetTeam.id, name } });
    const fresh = await ActiveSessionModel.findOne({ id }).lean();
    broadcastSession(id, fresh || session);
    res.status(200).json(fresh || session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Player leave
export const playerLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const playerId = req.auth?._id?.toString();
    if (!playerId) return res.status(401).json({ message: 'Unauthorized' });
    const session = await ActiveSessionModel.findOne({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.teams = (session.teams || []).map((team) => ({
      ...team.toObject?.() || team,
      players: (team.players || []).filter((p) => p.id !== playerId)
    }));
    session.updatedAt = new Date();
    await session.save();
    await logSessionEvent(id, { event: 'PLAYER_LEFT', actorId: playerId, payload: {} });
    const fresh = await ActiveSessionModel.findOne({ id }).lean();
    broadcastSession(id, fresh || session);
    res.status(200).json(fresh || session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
