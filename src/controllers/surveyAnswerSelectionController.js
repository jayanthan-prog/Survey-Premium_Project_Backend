const SurveyAnswerSelection = require('../models/survey_answer_selection');

// Get all selections
exports.getAllSelections = async (req, res) => {
  try {
    const selections = await SurveyAnswerSelection.findAll();
    res.json(selections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch answer selections' });
  }
};

// Get selection by ID
exports.getSelectionById = async (req, res) => {
  try {
    const selection = await SurveyAnswerSelection.findByPk(req.params.id);
    if (!selection) return res.status(404).json({ error: 'Selection not found' });
    res.json(selection);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch selection' });
  }
};

// Create a new selection
exports.createSelection = async (req, res) => {
  try {
    const newSelection = await SurveyAnswerSelection.create(req.body);
    res.status(201).json(newSelection);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create selection' });
  }
};

// Update selection
exports.updateSelection = async (req, res) => {
  try {
    const selection = await SurveyAnswerSelection.findByPk(req.params.id);
    if (!selection) return res.status(404).json({ error: 'Selection not found' });
    await selection.update(req.body);
    res.json(selection);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update selection' });
  }
};

// Delete selection
exports.deleteSelection = async (req, res) => {
  try {
    const selection = await SurveyAnswerSelection.findByPk(req.params.id);
    if (!selection) return res.status(404).json({ error: 'Selection not found' });
    await selection.destroy();
    res.json({ message: 'Selection deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete selection' });
  }
};
