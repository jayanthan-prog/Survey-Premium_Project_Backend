const SurveyRelease = require('../models/survey_release');

// GET all releases
exports.getAllSurveyReleases = async (req, res) => {
  try {
    const releases = await SurveyRelease.findAll({
      order: [['created_at', 'DESC']],
    });
    res.json(releases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch survey releases' });
  }
};

// GET release by ID
exports.getSurveyReleaseById = async (req, res) => {
  try {
    const release = await SurveyRelease.findByPk(req.params.id);
    if (!release) {
      return res.status(404).json({ error: 'Survey release not found' });
    }
    res.json(release);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch survey release' });
  }
};

// CREATE release
exports.createSurveyRelease = async (req, res) => {
  try {
    const release = await SurveyRelease.create(req.body);
    res.status(201).json(release);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create survey release' });
  }
};

// UPDATE release
exports.updateSurveyRelease = async (req, res) => {
  try {
    const release = await SurveyRelease.findByPk(req.params.id);
    if (!release) {
      return res.status(404).json({ error: 'Survey release not found' });
    }

    await release.update(req.body);
    res.json(release);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update survey release' });
  }
};

// DELETE release
exports.deleteSurveyRelease = async (req, res) => {
  try {
    const release = await SurveyRelease.findByPk(req.params.id);
    if (!release) {
      return res.status(404).json({ error: 'Survey release not found' });
    }

    await release.destroy();
    res.json({ message: 'Survey release deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete survey release' });
  }
};
