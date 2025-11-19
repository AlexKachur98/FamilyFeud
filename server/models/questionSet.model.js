// models/questionSet.model.js
import mongoose from 'mongoose';
import Question from './question.model.js';

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
  questions: [ Question.schema ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

QuestionSetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('QuestionSet', QuestionSetSchema);
