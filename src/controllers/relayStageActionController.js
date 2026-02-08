// Use the centralized models loader so we get the same Sequelize model instance used across the app
// and avoid mismatches between directly requiring a model file and the loaded db object.
// We'll require inside handlers (lazy) to avoid circular-init timing problems.

// Get all relay stage actions
exports.getAllRelayStageActions = async (req, res) => {
  try {
    const { RelayStageAction } = require('../models');
    if (!RelayStageAction) throw new Error('RelayStageAction model not available');
    const actions = await RelayStageAction.findAll();
    res.json(actions);
  } catch (error) {
    console.error('relayStageActionController.getAllRelayStageActions error', error.stack || error);
    res.status(500).json({ error: 'Failed to fetch relay stage actions' });
  }
};

// Get relay stage action by ID
exports.getRelayStageActionById = async (req, res) => {
  try {
    const { RelayStageAction } = require('../models');
    if (!RelayStageAction) throw new Error('RelayStageAction model not available');
    const action = await RelayStageAction.findByPk(req.params.id);
    if (!action) return res.status(404).json({ error: 'Relay stage action not found' });
    res.json(action);
  } catch (error) {
    console.error('relayStageActionController.getRelayStageActionById error', error.stack || error);
    res.status(500).json({ error: 'Failed to fetch relay stage action' });
  }
};

// Create new relay stage action
exports.createRelayStageAction = async (req, res) => {
  try {
    const { RelayStageAction } = require('../models');
    if (!RelayStageAction) throw new Error('RelayStageAction model not available');
    const newAction = await RelayStageAction.create(req.body);
    res.status(201).json(newAction);
  } catch (error) {
    console.error('relayStageActionController.createRelayStageAction error', error.stack || error);
    res.status(500).json({ error: 'Failed to create relay stage action' });
  }
};

// Update relay stage action
exports.updateRelayStageAction = async (req, res) => {
  try {
    const { RelayStageAction } = require('../models');
    if (!RelayStageAction) throw new Error('RelayStageAction model not available');
    const action = await RelayStageAction.findByPk(req.params.id);
    if (!action) return res.status(404).json({ error: 'Relay stage action not found' });
    await action.update(req.body);
    res.json(action);
  } catch (error) {
    console.error('relayStageActionController.updateRelayStageAction error', error.stack || error);
    res.status(500).json({ error: 'Failed to update relay stage action' });
  }
};

// Delete relay stage action
exports.deleteRelayStageAction = async (req, res) => {
  try {
    const { RelayStageAction } = require('../models');
    if (!RelayStageAction) throw new Error('RelayStageAction model not available');
    const action = await RelayStageAction.findByPk(req.params.id);
    if (!action) return res.status(404).json({ error: 'Relay stage action not found' });
    await action.destroy();
    res.json({ message: 'Relay stage action deleted successfully' });
  } catch (error) {
    console.error('relayStageActionController.deleteRelayStageAction error', error.stack || error);
    res.status(500).json({ error: 'Failed to delete relay stage action' });
  }
};
