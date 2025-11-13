import QuestionModel from '../models/question.model.js';

const getAllQuestions = async (req, res) => {
    try {
        const questions = await QuestionModel.find();
        
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getQuestion = async (req, res) => {
    try {
        const question = await QuestionModel.findById(req.params.id);

        if (!question) return res.status(404).json({ message: 'Question not found' });

        res.status(200).json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createQuestion = async (req, res) => {
    try {
        const newQuestion = new QuestionModel(req.body);

        await newQuestion.save();
        
        res.status(201).json(newQuestion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default { getAllQuestions, getQuestion, createQuestion };