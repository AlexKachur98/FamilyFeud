
import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  id: {
    type: String,
    required: "Team ID is required"
  },
  name: {
    type: String,
    trim: true,
    required: "Team name is required"
  },
  ready: {
    type: Boolean,
    default: false
  },
  players: {
    type: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        ready: { type: Boolean, default: false }
      }
    ],
    default: []
  },
  score: {
    type: Number,
    default: 0
  },
  strikes: {
    type: Number,
    default: 0
  }
});

const ActiveSessionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: "Session ID is required",
    unique: true
  },
  hostName: {
    type: String,
    trim: true,
    required: "Host name is required"
  },
  hostUserId: {
    type: String,
    default: null,
    index: true
  },
  activePlayerId: {
    type: String,
    default: null
  },
  accessCode: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['lobby', 'ready', 'in_progress', 'completed'],
    default: 'lobby'
  },
  questionSetId: {
    type: String,
    required: "Question set ID is required"
  },
  settings: {
    type: Object,
    default: {}
  },
  teams: {
    type: [TeamSchema],
    default: []
  },
  controlTeamId: {
    type: String,
    default: null
  },
  revealedAnswers: {
    type: [
      {
        index: Number,
        answer: String,
        points: Number,
        revealed: { type: Boolean, default: false }
      }
    ],
    default: []
  },
  currentQuestionId: {
    type: String,
    default: null
  },
  currentQuestionText: {
    type: String,
    default: null
  },
  currentQuestionSize: {
    type: Number,
    default: null
  },
  currentRound: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ActiveSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('ActiveSession', ActiveSessionSchema);
