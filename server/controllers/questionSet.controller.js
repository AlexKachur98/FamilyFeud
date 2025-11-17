import QuestionSetModel from '../models/questionSet.model.js';

// Get all question sets (with populated questions)
export const getAllQuestionSets = async (req, res) => {
  try {
    const questionSets = await QuestionSetModel.find();
    res.status(200).json(questionSets);
  } catch (error) {
    console.error('Error fetching question sets:', error);
    res.status(500).json({ message: 'Server error while fetching question sets' });
  }
};

// Get a specific question set (with populated questions)
export const getQuestionSet = async (req, res) => {
  try {
    const questionSet = await QuestionSetModel.findById(req.params.id);
    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }
    res.status(200).json(questionSet);
  } catch (error) {
    console.error('Error fetching question set:', error);
    res.status(500).json({ message: 'Server error while fetching question set' });
  }
};

// Create a new question set
export const createQuestionSet = async (req, res) => {
  try {
    const { title, category, prompt, roundType, tags, answers } = req.body;

    // Create the question set
    const questionSet = new QuestionSetModel({
      title,
      category,
      prompt,
      roundType,
      tags: tags || [],
      answers: answers || []
    });

    await questionSet.save();
    res.status(201).json(questionSet); // Just return the saved set, no populate needed
  } catch (error) {
    console.error('Error creating question set:', error);
    res.status(500).json({ message: 'Server error while creating question set' });
  }
};

// Update a question set
export const updateQuestionSet = async (req, res) => {
  try {
    const { title, category, prompt, roundType, tags, answers } = req.body;

    const normalizedAnswers = Array.isArray(answers)
      ? answers
        .filter((entry) => entry && entry.answer)
        .map((entry) => ({
          answer: entry.answer,
          points: Number(entry.points) || 0,
          aliases: Array.isArray(entry.aliases)
            ? entry.aliases.filter(Boolean).map((alias) => alias.trim())
            : []
        }))
      : undefined;

    const updatedSet = await QuestionSetModel.findByIdAndUpdate(
      req.params.id,
      {
        title,
        category,
        prompt,
        roundType,
        tags: Array.isArray(tags) ? tags : [],
        ...(normalizedAnswers ? { answers: normalizedAnswers } : {}),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    res.status(200).json(updatedSet);
  } catch (error) {
    console.error('Error updating question set:', error);
    res.status(500).json({ message: 'Server error while updating question set' });
  }
};

// Add a question (answer entry) to a set
export const addQuestionToSet = async (req, res) => {
  try {
    const { answer, points, aliases } = req.body;

    if (!answer || points === undefined || points === null) {
      return res.status(400).json({ message: 'Answer text and points are required' });
    }

    const questionSet = await QuestionSetModel.findById(req.params.id);
    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    questionSet.answers.push({
      answer,
      points: Number(points) || 0,
      aliases: Array.isArray(aliases)
        ? aliases.filter(Boolean).map((alias) => alias.trim())
        : []
    });
    questionSet.updatedAt = new Date();
    await questionSet.save();

    const updatedSet = await QuestionSetModel.findById(req.params.id);
    res.status(200).json(updatedSet);
  } catch (error) {
    console.error('Error adding question to set:', error);
    res.status(500).json({ message: 'Server error while adding question to set' });
  }
};

// Remove a question (answer entry) from a set
export const removeQuestionFromSet = async (req, res) => {
  try {
    const { answerId } = req.body;

    if (!answerId) {
      return res.status(400).json({ message: 'Answer ID is required' });
    }

    const questionSet = await QuestionSetModel.findById(req.params.id);
    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    questionSet.answers = questionSet.answers.filter(
      (entry) => entry?._id?.toString() !== answerId
    );
    questionSet.updatedAt = new Date();
    await questionSet.save();

    const updatedSet = await QuestionSetModel.findById(req.params.id);
    res.status(200).json(updatedSet);
  } catch (error) {
    console.error('Error removing question from set:', error);
    res.status(500).json({ message: 'Server error while removing question from set' });
  }
};

// Delete a question set
export const deleteQuestionSet = async (req, res) => {
  try {
    const questionSet = await QuestionSetModel.findByIdAndDelete(req.params.id);
    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }
    res.status(200).json({ message: 'Question set deleted successfully' });
  } catch (error) {
    console.error('Error deleting question set:', error);
    res.status(500).json({ message: 'Server error while deleting question set' });
  }
};
