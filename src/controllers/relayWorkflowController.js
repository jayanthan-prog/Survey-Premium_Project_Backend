'use strict';
const db = require('../models');
const RelayWorkflow = db.RelayWorkflow;

// GET all relay workflows
exports.getAllRelayWorkflows = async (req, res) => {
  try {
    const workflows = await RelayWorkflow.findAll();
    res.json(workflows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET relay workflow by ID
exports.getRelayWorkflowById = async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await RelayWorkflow.findByPk(id);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    res.json(workflow);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// CREATE a new relay workflow
exports.createRelayWorkflow = async (req, res) => {
  try {
    const workflow = await RelayWorkflow.create(req.body);
    res.status(201).json(workflow);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to create workflow', details: error.message });
  }
};

// UPDATE a relay workflow
exports.updateRelayWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await RelayWorkflow.findByPk(id);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    await workflow.update(req.body);
    res.json(workflow);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to update workflow', details: error.message });
  }
};

// DELETE a relay workflow
exports.deleteRelayWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await RelayWorkflow.findByPk(id);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    await workflow.destroy();
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
};
