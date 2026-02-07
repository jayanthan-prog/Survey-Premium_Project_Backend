const SurveyQuestion = require('../models/survey_question');

// GET all questions
exports.getAllSurveyQuestions = async (req, res) => {
  try {
    const questions = await SurveyQuestion.findAll({
      order: [['sort_order', 'ASC']],
    });
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch survey questions' });
  }
};

// GET question by ID
exports.getSurveyQuestionById = async (req, res) => {
  try {
    const question = await SurveyQuestion.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Survey question not found' });
    }
    res.json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch survey question' });
  }
};

// CREATE question
exports.createSurveyQuestion = async (req, res) => {
  try {
    const question = await SurveyQuestion.create(req.body);
    res.status(201).json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create survey question' });
  }
};

// UPDATE question
exports.updateSurveyQuestion = async (req, res) => {
  try {
    const question = await SurveyQuestion.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Survey question not found' });
    }

    await question.update(req.body);
    res.json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update survey question' });
  }
};

// DELETE question
exports.deleteSurveyQuestion = async (req, res) => {
  try {
    const question = await SurveyQuestion.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Survey question not found' });
    }

    await question.destroy();
    res.json({ message: 'Survey question deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete survey question' });
  }
};
