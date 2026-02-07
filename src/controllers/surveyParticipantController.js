const SurveyParticipant = require('../models/survey_participant');

/** Get all participants */
exports.getAllParticipants = async (req, res) => {
  try {
    const participants = await SurveyParticipant.findAll();
    res.json(participants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** Get participant by ID */
exports.getParticipantById = async (req, res) => {
  try {
    const participant = await SurveyParticipant.findByPk(req.params.id);
    if (!participant) return res.status(404).json({ error: 'Not found' });
    res.json(participant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** Create new participant */
exports.createParticipant = async (req, res) => {
  try {
    const { survey_id, user_id, external_ref, status, invited_at, completed_at, meta } = req.body;

    const newParticipant = await SurveyParticipant.create({
      survey_id,
      user_id: user_id || null,
      external_ref,
      status: status || 'INVITED',
      invited_at,
      completed_at,
      meta: meta ? JSON.stringify(meta) : JSON.stringify({}),
    });

    res.status(201).json(newParticipant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/** Update participant by ID */
exports.updateParticipant = async (req, res) => {
  try {
    const participant = await SurveyParticipant.findByPk(req.params.id);
    if (!participant) return res.status(404).json({ error: 'Not found' });

    const { user_id, external_ref, status, invited_at, completed_at, meta } = req.body;

    if (user_id !== undefined) participant.user_id = user_id;
    if (external_ref !== undefined) participant.external_ref = external_ref;
    if (status !== undefined) participant.status = status;
    if (invited_at !== undefined) participant.invited_at = invited_at;
    if (completed_at !== undefined) participant.completed_at = completed_at;
    if (meta !== undefined) participant.meta = JSON.stringify(meta);

    await participant.save();
    res.json(participant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/** Delete participant by ID */
exports.deleteParticipant = async (req, res) => {
  try {
    const participant = await SurveyParticipant.findByPk(req.params.id);
    if (!participant) return res.status(404).json({ error: 'Not found' });

    await participant.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
