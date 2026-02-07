'use strict';

const ActionPlan = require('../models/action_plan');

exports.getAllActionPlans = async (req, res) => {
  try {
    const plans = await ActionPlan.findAll();
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch action plans' });
  }
};

exports.getActionPlanById = async (req, res) => {
  try {
    const plan = await ActionPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Action plan not found' });
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch action plan' });
  }
};

exports.createActionPlan = async (req, res) => {
  try {
    const newPlan = await ActionPlan.create(req.body);
    res.status(201).json(newPlan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create action plan' });
  }
};

exports.updateActionPlan = async (req, res) => {
  try {
    const plan = await ActionPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Action plan not found' });

    await plan.update(req.body);
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update action plan' });
  }
};

exports.deleteActionPlan = async (req, res) => {
  try {
    const plan = await ActionPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Action plan not found' });

    await plan.destroy();
    res.json({ message: 'Action plan deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete action plan' });
  }
};
