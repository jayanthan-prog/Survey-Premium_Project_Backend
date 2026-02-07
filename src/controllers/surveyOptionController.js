const SurveyOption = require('../models/survey_options');

/**
 * Get all options
 */
exports.getAllOptions = async (req, res) => {
  try {
    const options = await SurveyOption.findAll();
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get option by ID
 */
exports.getOptionById = async (req, res) => {
  try {
    const option = await SurveyOption.findByPk(req.params.id);
    if (!option) return res.status(404).json({ error: 'Not found' });
    res.json(option);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create new option
 */
exports.createOption = async (req, res) => {
  try {
    const { survey_id, parent_option_id, code, label, description, sort_order, is_active, option_meta } = req.body;

    const newOption = await SurveyOption.create({
      survey_id,
      parent_option_id: parent_option_id || null,
      code,
      label,
      description,
      sort_order,
      is_active,
      option_meta: option_meta ? JSON.stringify(option_meta) : null,
    });

    res.status(201).json(newOption);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Update option by ID
 */
exports.updateOption = async (req, res) => {
  try {
    const option = await SurveyOption.findByPk(req.params.id);
    if (!option) return res.status(404).json({ error: 'Not found' });

    const { parent_option_id, code, label, description, sort_order, is_active, option_meta } = req.body;

    if (parent_option_id !== undefined) option.parent_option_id = parent_option_id;
    if (code !== undefined) option.code = code;
    if (label !== undefined) option.label = label;
    if (description !== undefined) option.description = description;
    if (sort_order !== undefined) option.sort_order = sort_order;
    if (is_active !== undefined) option.is_active = is_active;
    if (option_meta !== undefined) option.option_meta = JSON.stringify(option_meta);

    await option.save();
    res.json(option);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Delete option by ID
 */
exports.deleteOption = async (req, res) => {
  try {
    const option = await SurveyOption.findByPk(req.params.id);
    if (!option) return res.status(404).json({ error: 'Not found' });

    await option.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
