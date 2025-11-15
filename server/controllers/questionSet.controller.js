import QuestionSetModel from '../models/questionSet.model.js';
import QuestionModel from '../models/question.model.js';

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
    const { title, description, roundType, tags, questionIds } = req.body;

    // Validate that all question IDs exist
    if (questionIds && questionIds.length > 0) {
      const questionsExist = await QuestionModel.countDocuments({
        _id: { $in: questionIds }
      });

      if (questionsExist !== questionIds.length) {
        return res.status(400).json({ message: 'One or more questions do not exist' });
      }
    }

    const updatedSet = await QuestionSetModel.findByIdAndUpdate(
      req.params.id,
      {
        title,
        category,
        prompt,
        roundType,
        tags: tags || [],
        answers: questionIds || [],
        updatedAt: new Date()
      },
      { new: true }
    ).populate('answers');

    if (!updatedSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    res.status(200).json(updatedSet);
  } catch (error) {
    console.error('Error updating question set:', error);
    res.status(500).json({ message: 'Server error while updating question set' });
  }
};

// Add a question to a set
export const addQuestionToSet = async (req, res) => {
  try {
    const { questionId } = req.body;

    // Check if the question exists
    const question = await QuestionModel.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const questionSet = await QuestionSetModel.findById(req.params.id);
    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    // Avoid duplicate questions
    if (!questionSet.questions.includes(questionId)) {
      questionSet.questions.push(questionId);
      questionSet.updatedAt = new Date();
      await questionSet.save();
    }

    // Return the updated set with populated questions
    const updatedSet = await QuestionSetModel.findById(req.params.id);
    res.status(200).json(updatedSet);
  } catch (error) {
    console.error('Error adding question to set:', error);
    res.status(500).json({ message: 'Server error while adding question to set' });
  }
};

// Remove a question from a set
export const removeQuestionFromSet = async (req, res) => {
  try {
    const { questionId } = req.body;

    const questionSet = await QuestionSetModel.findById(req.params.id);
    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    // Remove the question if it exists in the set
    questionSet.questions = questionSet.questions.filter(
      id => id.toString() !== questionId
    );
    questionSet.updatedAt = new Date();
    await questionSet.save();

    // Return the updated set with populated questions
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
