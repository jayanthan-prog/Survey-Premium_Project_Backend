const RelayStageAction = require('../models/relay_stage_action'); // must match the file name exactly

// GET all relay stage actions
exports.getAllRelayStageActions = async (req, res) => {
  try {
    const actions = await RelayStageAction.findAll();
    res.json(actions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET relay stage action by ID
exports.getRelayStageActionById = async (req, res) => {
  try {
    const { id } = req.params;
    const action = await RelayStageAction.findByPk(id);
    if (!action) return res.status(404).json({ message: 'Action not found' });
    res.json(action);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE new relay stage action
exports.createRelayStageAction = async (req, res) => {
  try {
    const { relay_stage_id, action_type, action_payload } = req.body;
    const newAction = await RelayStageAction.create({
      relay_stage_id,
      action_type,
      action_payload,
    });
    res.status(201).json(newAction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE relay stage action
exports.updateRelayStageAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { relay_stage_id, action_type, action_payload } = req.body;

    const action = await RelayStageAction.findByPk(id);
    if (!action) return res.status(404).json({ message: 'Action not found' });

    await action.update({ relay_stage_id, action_type, action_payload });
    res.json(action);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE relay stage action
exports.deleteRelayStageAction = async (req, res) => {
  try {
    const { id } = req.params;
    const action = await RelayStageAction.findByPk(id);
    if (!action) return res.status(404).json({ message: 'Action not found' });

    await action.destroy();
    res.json({ message: 'Action deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
