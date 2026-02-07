const RelayStage = require('../models/relay_stage');

// Get all relay stages
exports.getAllRelayStages = async (req, res) => {
  try {
    const stages = await RelayStage.findAll();
    res.json(stages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch relay stages' });
  }
};

// Get relay stage by ID
exports.getRelayStageById = async (req, res) => {
  try {
    const stage = await RelayStage.findByPk(req.params.id);
    if (!stage) return res.status(404).json({ error: 'Relay stage not found' });
    res.json(stage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch relay stage' });
  }
};

// Create new relay stage
exports.createRelayStage = async (req, res) => {
  try {
    const newStage = await RelayStage.create(req.body);
    res.status(201).json(newStage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create relay stage' });
  }
};

// Update relay stage
exports.updateRelayStage = async (req, res) => {
  try {
    const stage = await RelayStage.findByPk(req.params.id);
    if (!stage) return res.status(404).json({ error: 'Relay stage not found' });
    await stage.update(req.body);
    res.json(stage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update relay stage' });
  }
};

// Delete relay stage
exports.deleteRelayStage = async (req, res) => {
  try {
    const stage = await RelayStage.findByPk(req.params.id);
    if (!stage) return res.status(404).json({ error: 'Relay stage not found' });
    await stage.destroy();
    res.json({ message: 'Relay stage deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete relay stage' });
  }
};
