'use strict';

const ActionPlanItem = require('../models/action_plan_item');
const db = require('../models');
const { hasManageAccess, isApproverScoped, canAccessActionPlan, canAccessActionPlanItem } = require('../utils/ownershipScope');

function canManageActionPlanItems(req) {
  return hasManageAccess(req);
}

exports.getAllActionPlanItems = async (req, res) => {
  try {
    if (!canManageActionPlanItems(req)) {
      return res.status(403).json({ error: 'Only admin/approver can view action plan items' });
    }

    if (isApproverScoped(req)) {
      const [items] = await db.sequelize.query(
        `SELECT api.*
         FROM action_plan_items api
         INNER JOIN action_plans ap ON ap.action_plan_id = api.plan_id
         INNER JOIN surveys s ON s.survey_id = ap.survey_id
         WHERE s.created_by = :currentUserId
         ORDER BY api.created_at DESC`,
        { replacements: { currentUserId: req.userId } }
      );
      return res.json(items || []);
    }

    const items = await ActionPlanItem.findAll();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch action plan items' });
  }
};

exports.getActionPlanItemById = async (req, res) => {
  try {
    if (!canManageActionPlanItems(req)) {
      return res.status(403).json({ error: 'Only admin/approver can view action plan items' });
    }

    const item = await ActionPlanItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (isApproverScoped(req)) {
      const allowed = await canAccessActionPlanItem(req, db, req.params.id);
      if (!allowed) {
        return res.status(403).json({ error: 'Approvers can only access items for their surveys' });
      }
    }

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch action plan item' });
  }
};

exports.createActionPlanItem = async (req, res) => {
  try {
    if (!canManageActionPlanItems(req)) {
      return res.status(403).json({ error: 'Only admin/approver can create action plan items' });
    }

    if (!req.body || !req.body.plan_id) {
      return res.status(400).json({ error: 'plan_id is required' });
    }

    if (isApproverScoped(req)) {
      const allowed = await canAccessActionPlan(req, db, req.body.plan_id);
      if (!allowed) {
        return res.status(403).json({ error: 'Approvers can only create items for their surveys' });
      }
    }

    const newItem = await ActionPlanItem.create(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create action plan item' });
  }
};

exports.updateActionPlanItem = async (req, res) => {
  try {
    if (!canManageActionPlanItems(req)) {
      return res.status(403).json({ error: 'Only admin/approver can update action plan items' });
    }

    const item = await ActionPlanItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (isApproverScoped(req)) {
      const allowed = await canAccessActionPlanItem(req, db, req.params.id);
      if (!allowed) {
        return res.status(403).json({ error: 'Approvers can only update items for their surveys' });
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'plan_id')) {
        const nextPlanAllowed = await canAccessActionPlan(req, db, req.body.plan_id);
        if (!nextPlanAllowed) {
          return res.status(403).json({ error: 'Approvers can only move items to plans for their surveys' });
        }
      }
    }

    await item.update(req.body);
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update action plan item' });
  }
};

exports.deleteActionPlanItem = async (req, res) => {
  try {
    if (!canManageActionPlanItems(req)) {
      return res.status(403).json({ error: 'Only admin/approver can delete action plan items' });
    }

    const item = await ActionPlanItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (isApproverScoped(req)) {
      const allowed = await canAccessActionPlanItem(req, db, req.params.id);
      if (!allowed) {
        return res.status(403).json({ error: 'Approvers can only delete items for their surveys' });
      }
    }

    await item.destroy();
    res.json({ message: 'Action plan item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete action plan item' });
  }
};
