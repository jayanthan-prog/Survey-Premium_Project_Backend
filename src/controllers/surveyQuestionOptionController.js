const SurveyQuestionOption = require('../models/survey_question_option');

function parseMeta(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_err) {
    return {};
  }
}

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
    const { question_id, option_text, value, sort_order, meta, limit, selectedCount } = req.body;
    const nextMeta = {
      ...parseMeta(meta),
    };

    if (limit !== undefined) {
      nextMeta.limit = limit === '' || limit == null ? null : Math.max(0, Number(limit) || 0);
    }

    if (selectedCount !== undefined) {
      nextMeta.selectedCount = Math.max(0, Number(selectedCount) || 0);
    }

    const newOption = await SurveyQuestionOption.create({
      question_id,
      option_text,
      value,
      sort_order,
      meta: JSON.stringify(nextMeta),
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

    const { question_id, option_text, value, sort_order, meta, limit, selectedCount } = req.body;

    if (question_id !== undefined) option.question_id = question_id;
    if (option_text !== undefined) option.option_text = option_text;
    if (value !== undefined) option.value = value;
    if (sort_order !== undefined) option.sort_order = sort_order;
    if (meta !== undefined || limit !== undefined || selectedCount !== undefined) {
      const nextMeta = {
        ...parseMeta(option.meta),
        ...(meta !== undefined ? parseMeta(meta) : {}),
      };

      if (limit !== undefined) {
        nextMeta.limit = limit === '' || limit == null ? null : Math.max(0, Number(limit) || 0);
      }

      if (selectedCount !== undefined) {
        nextMeta.selectedCount = Math.max(0, Number(selectedCount) || 0);
      }

      option.meta = JSON.stringify(nextMeta);
    }

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
