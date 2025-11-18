import mongoose from 'mongoose';

const LogEntrySchema = new mongoose.Schema({
  ts: { type: Date, default: Date.now },
  actorId: { type: String, default: null },
  actorRole: { type: String, enum: ['host', 'player', 'system', null], default: 'system' },
  event: { type: String, required: true },
  payload: { type: Object, default: {} }
}, { _id: false });

const TeamSummarySchema = new mongoose.Schema({
  teamId: String,
  name: String,
  score: Number,
  players: [{ id: String, name: String }],
  pointsByPlayer: [{ playerId: String, points: Number }]
}, { _id: false });

const RoundSummarySchema = new mongoose.Schema({
  roundIndex: Number,
  questionId: String,
  pointsAwarded: Number,
  winnerTeamId: String
}, { _id: false });

const GameLogSchema = new mongoose.Schema({
  sessionId: { type: String, index: true, required: true },
  hostId: { type: String },
  settings: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  entries: { type: [LogEntrySchema], default: [] },
  final: {
    teamSummaries: { type: [TeamSummarySchema], default: [] },
    rounds: { type: [RoundSummarySchema], default: [] }
  }
});

export default mongoose.model('GameLog', GameLogSchema);
