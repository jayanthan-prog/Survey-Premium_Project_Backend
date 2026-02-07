const RelayStageAction = require('../models/relay_stage_action');

// Get all relay stage actions
exports.getAllRelayStageActions = async (req, res) => {
  try {
    const actions = await RelayStageAction.findAll();
    res.json(actions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch relay stage actions' });
  }
};

// Get relay stage action by ID
exports.getRelayStageActionById = async (req, res) => {
  try {
    const action = await RelayStageAction.findByPk(req.params.id);
    if (!action) return res.status(404).json({ error: 'Relay stage action not found' });
    res.json(action);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch relay stage action' });
  }
};

// Create new relay stage action
exports.createRelayStageAction = async (req, res) => {
  try {
    const newAction = await RelayStageAction.create(req.body);
    res.status(201).json(newAction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create relay stage action' });
  }
};

// Update relay stage action
exports.updateRelayStageAction = async (req, res) => {
  try {
    const action = await RelayStageAction.findByPk(req.params.id);
    if (!action) return res.status(404).json({ error: 'Relay stage action not found' });
    await action.update(req.body);
    res.json(action);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update relay stage action' });
  }
};

// Delete relay stage action
exports.deleteRelayStageAction = async (req, res) => {
  try {
    const action = await RelayStageAction.findByPk(req.params.id);
    if (!action) return res.status(404).json({ error: 'Relay stage action not found' });
    await action.destroy();
    res.json({ message: 'Relay stage action deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete relay stage action' });
  }
};
