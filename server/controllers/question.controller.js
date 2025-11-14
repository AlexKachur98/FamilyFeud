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

const MAX_ANSWERS = 8;
const ROUND_BUCKETS = {
    '1': { minAnswers: 5, maxAnswers: 6 },
    '2': { minAnswers: 5, maxAnswers: 6 },
    '3': { minAnswers: 7, maxAnswers: 8 },
    '4': { maxAnswers: 4 },
    single: { minAnswers: 5, maxAnswers: 6 },
    double: { minAnswers: 7, maxAnswers: 8 },
    triple: { minAnswers: 7, maxAnswers: 8 },
    fast: { maxAnswers: 4 },
};

const clampAnswerBound = (value) => {
    if (value === undefined) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    const normalized = Math.max(1, Math.min(MAX_ANSWERS, Math.floor(parsed)));
    return normalized;
};

const applyAnswerBounds = (query, minAnswers, maxAnswers) => {
    const boundsQuery = {};
    if (minAnswers && minAnswers > 0) {
        boundsQuery[`answers.${minAnswers - 1}`] = { $exists: true };
    }
    if (maxAnswers && maxAnswers >= 0) {
        boundsQuery[`answers.${maxAnswers}`] = { $exists: false };
    }
    return Object.keys(boundsQuery).length ? { ...query, ...boundsQuery } : query;
};

const getRandomQuestion = async (req, res) => {
    try {
        const { minAnswers: rawMin, maxAnswers: rawMax, round: roundParam } = req.query;

        let minAnswers = clampAnswerBound(rawMin);
        let maxAnswers = clampAnswerBound(rawMax);

        if (roundParam && ROUND_BUCKETS[roundParam]) {
            const preset = ROUND_BUCKETS[roundParam];
            if (preset.minAnswers && !minAnswers) minAnswers = preset.minAnswers;
            if (preset.maxAnswers && !maxAnswers) maxAnswers = preset.maxAnswers;
        }

        if (maxAnswers && minAnswers && maxAnswers < minAnswers) {
            [minAnswers, maxAnswers] = [undefined, maxAnswers];
        }

        let questionQuery = applyAnswerBounds({}, minAnswers, maxAnswers);
        let count = await QuestionModel.countDocuments(questionQuery);

        if (count === 0 && Object.keys(questionQuery).length) {
            questionQuery = {};
            count = await QuestionModel.countDocuments();
        }

        if (count === 0) return res.status(404).json({ message: 'Question not found' });

        const randomIndex = Math.floor(Math.random() * count);
        const result = await QuestionModel.findOne(questionQuery).skip(randomIndex);

        if (!result) return res.status(404).json({ message: 'Question not found' });

        const question = {
            _id: result._id,
            question: result.question,
            size: result.answers.length
        };

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

export default { getAllQuestions, getQuestion, getRandomQuestion, createQuestion };
