import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        trim: true,
        required: "Question is required"
    },
    answers: [{
        answer: {
            type: String,
            required: true,
            trim: true
        },
        points: {
            type: Number,
            required: true
        }
    }]
});

export default mongoose.model('Question', QuestionSchema)