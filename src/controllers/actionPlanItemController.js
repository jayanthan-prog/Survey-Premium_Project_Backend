'use strict';

const ActionPlanItem = require('../models/action_plan_item');

exports.getAllActionPlanItems = async (req, res) => {
  try {
    const items = await ActionPlanItem.findAll();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch action plan items' });
  }
};

exports.getActionPlanItemById = async (req, res) => {
  try {
    const item = await ActionPlanItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch action plan item' });
  }
};

exports.createActionPlanItem = async (req, res) => {
  try {
    const newItem = await ActionPlanItem.create(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create action plan item' });
  }
};

exports.updateActionPlanItem = async (req, res) => {
  try {
    const item = await ActionPlanItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    await item.update(req.body);
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update action plan item' });
  }
};

exports.deleteActionPlanItem = async (req, res) => {
  try {
    const item = await ActionPlanItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    await item.destroy();
    res.json({ message: 'Action plan item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete action plan item' });
  }
};
