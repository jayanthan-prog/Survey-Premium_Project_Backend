'use strict';

const ActionPlan = require('../models/action_plan');
const db = require('../models');
const { hasManageAccess, isApproverScoped, canAccessSurvey, canAccessActionPlan } = require('../utils/ownershipScope');

function normalizeRole(role) {
  const value = String(role || '').trim().toUpperCase();
  if (value === 'STUDENT') return 'USER';
  return value;
}

function canManageActionPlans(roles = []) {
  const normalized = (Array.isArray(roles) ? roles : [roles]).map(normalizeRole);
  return normalized.length > 0 && hasManageAccess({ userRoles: normalized });
}

exports.getAllActionPlans = async (req, res) => {
  try {
    if (!canManageActionPlans(req.userRoles || [])) {
      return res.status(403).json({ error: 'Only admin/approver can view action plans' });
    }

    if (isApproverScoped(req)) {
      const [plans] = await db.sequelize.query(
        `SELECT ap.*
         FROM action_plans ap
         INNER JOIN surveys s ON s.survey_id = ap.survey_id
         WHERE s.created_by = :currentUserId
         ORDER BY ap.created_at DESC`,
        { replacements: { currentUserId: req.userId } }
      );
      return res.json(plans || []);
    }

    const plans = await ActionPlan.findAll();
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch action plans' });
  }
};

exports.getActionPlanById = async (req, res) => {
  try {
    if (!canManageActionPlans(req.userRoles || [])) {
      return res.status(403).json({ error: 'Only admin/approver can view action plans' });
    }

    const plan = await ActionPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Action plan not found' });

    if (isApproverScoped(req)) {
      const allowed = await canAccessActionPlan(req, db, req.params.id);
      if (!allowed) {
        return res.status(403).json({ error: 'Approvers can only access action plans for their surveys' });
      }
    }

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch action plan' });
  }
};

exports.createActionPlan = async (req, res) => {
  try {
    if (!canManageActionPlans(req.userRoles || [])) {
      return res.status(403).json({ error: 'Only admin/approver can create action plans' });
    }

    if (!req.body || !req.body.title || !req.body.survey_id) {
      return res.status(400).json({ error: 'title and survey_id are required' });
    }

    if (isApproverScoped(req)) {
      const allowed = await canAccessSurvey(req, db, req.body.survey_id);
      if (!allowed) {
        return res.status(403).json({ error: 'Approvers can only create action plans for their surveys' });
      }
    }

    const newPlan = await ActionPlan.create(req.body);
    res.status(201).json(newPlan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create action plan' });
  }
};

exports.updateActionPlan = async (req, res) => {
  try {
    if (!canManageActionPlans(req.userRoles || [])) {
      return res.status(403).json({ error: 'Only admin/approver can update action plans' });
    }

    const plan = await ActionPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Action plan not found' });

    if (isApproverScoped(req)) {
      const allowed = await canAccessActionPlan(req, db, req.params.id);
      if (!allowed) {
        return res.status(403).json({ error: 'Approvers can only update action plans for their surveys' });
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'survey_id')) {
        const nextSurveyAllowed = await canAccessSurvey(req, db, req.body.survey_id);
        if (!nextSurveyAllowed) {
          return res.status(403).json({ error: 'Approvers can only move action plans to surveys they created' });
        }
      }
    }

    await plan.update(req.body);
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update action plan' });
  }
};

exports.deleteActionPlan = async (req, res) => {
  try {
    if (!canManageActionPlans(req.userRoles || [])) {
      return res.status(403).json({ error: 'Only admin/approver can delete action plans' });
    }

    const plan = await ActionPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Action plan not found' });

    if (isApproverScoped(req)) {
      const allowed = await canAccessActionPlan(req, db, req.params.id);
      if (!allowed) {
        return res.status(403).json({ error: 'Approvers can only delete action plans for their surveys' });
      }
    }

    await plan.destroy();
    res.json({ message: 'Action plan deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete action plan' });
  }
};
