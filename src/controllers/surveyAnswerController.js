const SurveyAnswer = require('../models/survey_answer');

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
    const { participation_id, field_key, value_json } = req.body;
    const newAnswer = await SurveyAnswer.create({
      participation_id,
      field_key,
      value_json: value_json ? JSON.stringify(value_json) : null,
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
    const { field_key, value_json } = req.body;
    const answer = await SurveyAnswer.findByPk(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Not found' });

    if (field_key !== undefined) answer.field_key = field_key;
    if (value_json !== undefined) answer.value_json = JSON.stringify(value_json);

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
