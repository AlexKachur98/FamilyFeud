import ActiveSessionModel from '../models/activeSession.model.js';
import QuestionModel from '../models/question.model.js';
import { ROUND_BUCKETS } from './question.controller.js';

const findTeamById = (session, teamId) =>
  session?.teams?.find((team) =>
    team?._id?.toString() === teamId || team?.id === teamId
  );

// Create a new game session
export const createGameSession = async (req, res) => {
  try {
    const { id, hostName, accessCode, questionSetId, teams } = req.body;
    const newSession = new ActiveSessionModel({
      id,
      hostName,
      accessCode,
      questionSetId,
      teams: teams || [],
      status: 'lobby',
    });
    await newSession.save();
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

    const roundBucket = ROUND_BUCKETS[roundType];
    if (!roundBucket) return res.status(400).json({ message: 'Invalid round type' });

    const { minAnswers, maxAnswers } = roundBucket;
    const questionQuery = {};
    if (minAnswers) questionQuery['answers.' + (minAnswers - 1)] = { $exists: true };
    if (maxAnswers) questionQuery['answers.' + maxAnswers] = { $exists: false };

    const count = await QuestionModel.countDocuments(questionQuery);
    if (count === 0) return res.status(404).json({ message: 'No questions available for this round' });

    const randomIndex = Math.floor(Math.random() * count);
    const question = await QuestionModel.findOne(questionQuery).skip(randomIndex);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    session.currentRound += 1;
    session.status = 'in_progress';
    session.updatedAt = new Date();
    await session.save();

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
    const { score, strikes } = req.body;
    const session = await ActiveSessionModel.findOne({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const team = findTeamById(session, teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (score !== undefined) team.score = score;
    if (strikes !== undefined) team.strikes = strikes;

    session.updatedAt = new Date();
    await session.save();
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


// Reveal next answer
export const revealAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await ActiveSessionModel.findOne({ id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Logic to reveal the next answer
    const updatedSession = await ActiveSessionModel.findOneAndUpdate(
      { id },
      { /* update fields */ },
      { new: true }
    );

    res.status(200).json(updatedSession);
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

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
