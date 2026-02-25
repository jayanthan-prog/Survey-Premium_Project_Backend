const db = require('../models');
const SurveyAnswer = db.SurveyAnswer;

/**
 * Get all survey answers
 */
exports.getAllAnswers = async (req, res) => {
  try {
    const answers = await SurveyAnswer.findAll();
    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get a survey answer by ID
 */
exports.getAnswerById = async (req, res) => {
  try {
    const answer = await SurveyAnswer.findByPk(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Not found' });
    res.json(answer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create a new survey answer
 */
exports.createAnswer = async (req, res) => {
  try {
    const { participation_id, question_id, value_json } = req.body;
    const newAnswer = await SurveyAnswer.create({
      participation_id,
      question_id,
      value_json,
    });
    res.status(201).json(newAnswer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Update a survey answer by ID
 */
exports.updateAnswer = async (req, res) => {
  try {
    const { question_id, value_json } = req.body;
    const answer = await SurveyAnswer.findByPk(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Not found' });

    if (question_id !== undefined) answer.question_id = question_id;
    if (value_json !== undefined) answer.value_json = value_json;

    await answer.save();
    res.json(answer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Delete a survey answer by ID
 */
exports.deleteAnswer = async (req, res) => {
  try {
    const answer = await SurveyAnswer.findByPk(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Not found' });

    await answer.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
