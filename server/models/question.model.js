import mongoose from 'mongoose';

// Note: MongoDB stores answers with 'answer' field, but we use 'text' in the schema
// for consistency. Mongoose will read 'answer' from DB and map to 'text'.
const AnswerSchema = new mongoose.Schema({
    // MongoDB field is 'answer', aliased to 'text' for code consistency
    text: { type: String, required: true, trim: true, alias: 'answer' },
    points: { type: Number, required: true }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Note: MongoDB stores questions with 'question' field, but we use 'text' in the schema
// for consistency. The 'alias' option allows both field names to work.
const QuestionSchema = new mongoose.Schema({
    // MongoDB field is 'question', aliased to 'text' for code consistency
    text: { type: String, trim: true, required: "Question is required", alias: 'question' },
    isFastMoney: { type: Boolean, default: false },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    tags: { type: [String], default: [] },
    answers: [ AnswerSchema ]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model('Question', QuestionSchema)