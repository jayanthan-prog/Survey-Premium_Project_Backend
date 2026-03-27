'use strict';
const { ApprovalStep } = require('../models');
const db = require('../models');
const { hasManageAccess, isApproverScoped, canAccessApprovalWorkflow, approvalOwnershipSql } = require('../utils/ownershipScope');

exports.getAll = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can view approval steps' });
        }

        if (isApproverScoped(req)) {
            const [rows] = await db.sequelize.query(
                `SELECT ast.*
				 FROM approval_steps ast
				 INNER JOIN approval_workflows aw ON aw.approval_workflow_id = ast.approval_workflow_id
				 WHERE ${approvalOwnershipSql('aw', 'currentUserId')}
				 ORDER BY ast.step_order ASC, ast.approval_step_id ASC`,
                { replacements: { currentUserId: req.userId } }
            );
            return res.json(rows || []);
        }

        return res.json(await ApprovalStep.findAll());
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.getById = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can view approval steps' });
        }

        const record = await ApprovalStep.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Not found' });

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalWorkflow(req, db, record.approval_workflow_id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only access steps for their surveys' });
            }
        }

        return res.json(record);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.create = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can create approval steps' });
        }

        if (!req.body || !req.body.approval_workflow_id) {
            return res.status(400).json({ error: 'approval_workflow_id is required' });
        }

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalWorkflow(req, db, req.body.approval_workflow_id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only create steps for their surveys' });
            }
        }

        return res.status(201).json(await ApprovalStep.create(req.body));
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.update = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can update approval steps' });
        }

        const record = await ApprovalStep.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Not found' });

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalWorkflow(req, db, record.approval_workflow_id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only update steps for their surveys' });
            }

            if (Object.prototype.hasOwnProperty.call(req.body || {}, 'approval_workflow_id')) {
                const nextAllowed = await canAccessApprovalWorkflow(req, db, req.body.approval_workflow_id);
                if (!nextAllowed) {
                    return res.status(403).json({ error: 'Approvers can only move steps to workflows for their surveys' });
                }
            }
        }

        await record.update(req.body);
        return res.json(record);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

exports.remove = async (req, res) => {
    try {
        if (!hasManageAccess(req)) {
            return res.status(403).json({ error: 'Only admin/approver can delete approval steps' });
        }

        const record = await ApprovalStep.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Not found' });

        if (isApproverScoped(req)) {
            const allowed = await canAccessApprovalWorkflow(req, db, record.approval_workflow_id);
            if (!allowed) {
                return res.status(403).json({ error: 'Approvers can only delete steps for their surveys' });
            }
        }

        await record.destroy();
        return res.json({ message: 'Deleted' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
