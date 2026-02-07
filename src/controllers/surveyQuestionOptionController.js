const SurveyQuestionOption = require('../models/survey_question_option');

/** Get all question options */
exports.getAllOptions = async (req, res) => {
  try {
    const options = await SurveyQuestionOption.findAll();
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** Get question option by ID */
exports.getOptionById = async (req, res) => {
  try {
    const option = await SurveyQuestionOption.findByPk(req.params.id);
    if (!option) return res.status(404).json({ error: 'Not found' });
    res.json(option);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** Create new question option */
exports.createOption = async (req, res) => {
  try {
    const { question_id, option_text, value, sort_order, meta } = req.body;

    const newOption = await SurveyQuestionOption.create({
      question_id,
      option_text,
      value,
      sort_order,
      meta: meta ? JSON.stringify(meta) : JSON.stringify({}),
    });

    res.status(201).json(newOption);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/** Update question option by ID */
exports.updateOption = async (req, res) => {
  try {
    const option = await SurveyQuestionOption.findByPk(req.params.id);
    if (!option) return res.status(404).json({ error: 'Not found' });

    const { question_id, option_text, value, sort_order, meta } = req.body;

    if (question_id !== undefined) option.question_id = question_id;
    if (option_text !== undefined) option.option_text = option_text;
    if (value !== undefined) option.value = value;
    if (sort_order !== undefined) option.sort_order = sort_order;
    if (meta !== undefined) option.meta = JSON.stringify(meta);

    await option.save();
    res.json(option);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/** Delete question option by ID */
exports.deleteOption = async (req, res) => {
  try {
    const option = await SurveyQuestionOption.findByPk(req.params.id);
    if (!option) return res.status(404).json({ error: 'Not found' });

    await option.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
