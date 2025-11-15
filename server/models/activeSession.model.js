
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
  accessCode: {
    type: String,
    required: "Access code is required"
  },
  status: {
    type: String,
    enum: ['lobby', 'in_progress', 'completed'],
    default: 'lobby'
  },
  questionSetId: {
    type: String,
    required: "Question set ID is required"
  },
  teams: {
    type: [TeamSchema],
    default: []
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
