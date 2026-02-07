const RelayInstance = require('../models/relay_instance');

// Get all relay instances
exports.getAllRelayInstances = async (req, res) => {
  try {
    const instances = await RelayInstance.findAll();
    res.json(instances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch relay instances' });
  }
};

// Get relay instance by ID
exports.getRelayInstanceById = async (req, res) => {
  try {
    const instance = await RelayInstance.findByPk(req.params.id);
    if (!instance) return res.status(404).json({ error: 'Relay instance not found' });
    res.json(instance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch relay instance' });
  }
};

// Create new relay instance
exports.createRelayInstance = async (req, res) => {
  try {
    const newInstance = await RelayInstance.create(req.body);
    res.status(201).json(newInstance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create relay instance' });
  }
};

// Update relay instance
exports.updateRelayInstance = async (req, res) => {
  try {
    const instance = await RelayInstance.findByPk(req.params.id);
    if (!instance) return res.status(404).json({ error: 'Relay instance not found' });
    await instance.update(req.body);
    res.json(instance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update relay instance' });
  }
};

// Delete relay instance
exports.deleteRelayInstance = async (req, res) => {
  try {
    const instance = await RelayInstance.findByPk(req.params.id);
    if (!instance) return res.status(404).json({ error: 'Relay instance not found' });
    await instance.destroy();
    res.json({ message: 'Relay instance deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete relay instance' });
  }
};
