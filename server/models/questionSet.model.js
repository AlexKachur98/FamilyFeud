// models/questionSet.model.js
import mongoose from 'mongoose';

const QuestionSetSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  prompt: { type: String, required: true, trim: true },
  roundType: {
    type: String,
    enum: ['single', 'double', 'triple'],
    default: 'single',
  },
  tags: [{ type: String, trim: true }],
  answers: [
    {
      answer: { type: String, required: true, trim: true },
      points: { type: Number, required: true },
      aliases: [{ type: String, trim: true }],
    },
  ],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

QuestionSetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('QuestionSet', QuestionSetSchema);
