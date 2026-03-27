'use strict';

function normalizeRole(role) {
    const value = String(role || '').trim().toUpperCase();
    if (value === 'STUDENT') return 'USER';
    return value;
}

function getRoleSet(req) {
    const roles = Array.isArray(req && req.userRoles) ? req.userRoles : [];
    return new Set(roles.map(normalizeRole));
}

function isAdmin(req) {
    return getRoleSet(req).has('ADMIN');
}

function isApprover(req) {
    return getRoleSet(req).has('APPROVER');
}

function isApproverScoped(req) {
    return isApprover(req) && !isAdmin(req);
}

function hasManageAccess(req) {
    return isAdmin(req) || isApprover(req);
}

function normalizeEntityType(entityType) {
    return String(entityType || '').trim().toUpperCase();
}

async function queryOne(db, sql, replacements = {}, transaction) {
    const [rows] = await db.sequelize.query(sql, { replacements, transaction });
    return rows && rows[0] ? rows[0] : null;
}

async function getSurveyOwnerId(db, surveyId, transaction) {
    const row = await queryOne(
        db,
        'SELECT created_by FROM surveys WHERE survey_id = :surveyId LIMIT 1',
        { surveyId },
        transaction
    );
    return row ? Number(row.created_by) : null;
}

async function getReleaseSurveyOwnerId(db, releaseId, transaction) {
    const row = await queryOne(
        db,
        `SELECT s.created_by
     FROM survey_releases sr
     INNER JOIN surveys s ON s.survey_id = sr.survey_id
     WHERE sr.release_id = :releaseId
     LIMIT 1`,
        { releaseId },
        transaction
    );
    return row ? Number(row.created_by) : null;
}

async function getActionPlanSurveyOwnerId(db, actionPlanId, transaction) {
    const row = await queryOne(
        db,
        `SELECT s.created_by
     FROM action_plans ap
     INNER JOIN surveys s ON s.survey_id = ap.survey_id
     WHERE ap.action_plan_id = :actionPlanId
     LIMIT 1`,
        { actionPlanId },
        transaction
    );
    return row ? Number(row.created_by) : null;
}

async function getActionPlanItemSurveyOwnerId(db, itemId, transaction) {
    const row = await queryOne(
        db,
        `SELECT s.created_by
     FROM action_plan_items api
     INNER JOIN action_plans ap ON ap.action_plan_id = api.plan_id
     INNER JOIN surveys s ON s.survey_id = ap.survey_id
     WHERE api.item_id = :itemId
     LIMIT 1`,
        { itemId },
        transaction
    );
    return row ? Number(row.created_by) : null;
}

async function getApprovalWorkflow(db, approvalWorkflowId, transaction) {
    return queryOne(
        db,
        'SELECT approval_workflow_id, entity_type, entity_id FROM approval_workflows WHERE approval_workflow_id = :approvalWorkflowId LIMIT 1',
        { approvalWorkflowId },
        transaction
    );
}

async function resolveSurveyOwnerIdFromEntity(db, entityType, entityId, transaction) {
    const normalizedType = normalizeEntityType(entityType);

    if (!normalizedType || entityId == null || entityId === '') {
        return null;
    }

    if (normalizedType === 'SURVEY') {
        return getSurveyOwnerId(db, entityId, transaction);
    }

    if (normalizedType === 'SURVEY_RELEASE' || normalizedType === 'RELEASE') {
        return getReleaseSurveyOwnerId(db, entityId, transaction);
    }

    if (normalizedType === 'ACTION_PLAN') {
        return getActionPlanSurveyOwnerId(db, entityId, transaction);
    }

    if (normalizedType === 'APPROVAL_WORKFLOW') {
        const workflow = await getApprovalWorkflow(db, entityId, transaction);
        if (!workflow) return null;
        return resolveSurveyOwnerIdFromEntity(db, workflow.entity_type, workflow.entity_id, transaction);
    }

    return null;
}

async function canAccessSurvey(req, db, surveyId, transaction) {
    if (isAdmin(req)) return true;
    if (!isApproverScoped(req)) return false;
    const ownerId = await getSurveyOwnerId(db, surveyId, transaction);
    return ownerId != null && Number(ownerId) === Number(req.userId);
}

async function canAccessRelease(req, db, releaseId, transaction) {
    if (isAdmin(req)) return true;
    if (!isApproverScoped(req)) return false;
    const ownerId = await getReleaseSurveyOwnerId(db, releaseId, transaction);
    return ownerId != null && Number(ownerId) === Number(req.userId);
}

async function canAccessActionPlan(req, db, actionPlanId, transaction) {
    if (isAdmin(req)) return true;
    if (!isApproverScoped(req)) return false;
    const ownerId = await getActionPlanSurveyOwnerId(db, actionPlanId, transaction);
    return ownerId != null && Number(ownerId) === Number(req.userId);
}

async function canAccessActionPlanItem(req, db, itemId, transaction) {
    if (isAdmin(req)) return true;
    if (!isApproverScoped(req)) return false;
    const ownerId = await getActionPlanItemSurveyOwnerId(db, itemId, transaction);
    return ownerId != null && Number(ownerId) === Number(req.userId);
}

async function canAccessApprovalEntity(req, db, entityType, entityId, transaction) {
    if (isAdmin(req)) return true;
    if (!isApproverScoped(req)) return false;

    const ownerId = await resolveSurveyOwnerIdFromEntity(db, entityType, entityId, transaction);
    return ownerId != null && Number(ownerId) === Number(req.userId);
}

async function canAccessApprovalWorkflow(req, db, approvalWorkflowId, transaction) {
    if (isAdmin(req)) return true;
    if (!isApproverScoped(req)) return false;

    const workflow = await getApprovalWorkflow(db, approvalWorkflowId, transaction);
    if (!workflow) return false;

    return canAccessApprovalEntity(req, db, workflow.entity_type, workflow.entity_id, transaction);
}

async function canAccessApprovalItem(req, db, approvalItemId, transaction) {
    if (isAdmin(req)) return true;
    if (!isApproverScoped(req)) return false;

    const row = await queryOne(
        db,
        `SELECT aw.entity_type, aw.entity_id
     FROM approval_items ai
     INNER JOIN approval_workflows aw ON aw.approval_workflow_id = ai.approval_workflow_id
     WHERE ai.approval_item_id = :approvalItemId
     LIMIT 1`,
        { approvalItemId },
        transaction
    );

    if (!row) return false;
    return canAccessApprovalEntity(req, db, row.entity_type, row.entity_id, transaction);
}

async function canAccessApprovalAction(req, db, approvalActionId, transaction) {
    if (isAdmin(req)) return true;
    if (!isApproverScoped(req)) return false;

    const row = await queryOne(
        db,
        `SELECT aw.entity_type, aw.entity_id
     FROM approval_actions aa
     INNER JOIN approval_items ai ON ai.approval_item_id = aa.approval_item_id
     INNER JOIN approval_workflows aw ON aw.approval_workflow_id = ai.approval_workflow_id
     WHERE aa.approval_action_id = :approvalActionId
     LIMIT 1`,
        { approvalActionId },
        transaction
    );

    if (!row) return false;
    return canAccessApprovalEntity(req, db, row.entity_type, row.entity_id, transaction);
}

function approvalOwnershipSql(alias, userParamName) {
    const aw = alias || 'aw';
    const userParam = userParamName || 'currentUserId';

    return `(
    (UPPER(${aw}.entity_type) = 'SURVEY' AND EXISTS (
      SELECT 1 FROM surveys s
      WHERE s.survey_id = ${aw}.entity_id AND s.created_by = :${userParam}
    ))
    OR (UPPER(${aw}.entity_type) IN ('SURVEY_RELEASE', 'RELEASE') AND EXISTS (
      SELECT 1
      FROM survey_releases sr
      INNER JOIN surveys s ON s.survey_id = sr.survey_id
      WHERE sr.release_id = ${aw}.entity_id AND s.created_by = :${userParam}
    ))
    OR (UPPER(${aw}.entity_type) = 'ACTION_PLAN' AND EXISTS (
      SELECT 1
      FROM action_plans ap
      INNER JOIN surveys s ON s.survey_id = ap.survey_id
      WHERE ap.action_plan_id = ${aw}.entity_id AND s.created_by = :${userParam}
    ))
  )`;
}

module.exports = {
    isAdmin,
    isApprover,
    isApproverScoped,
    hasManageAccess,
    normalizeEntityType,
    canAccessSurvey,
    canAccessRelease,
    canAccessActionPlan,
    canAccessActionPlanItem,
    canAccessApprovalEntity,
    canAccessApprovalWorkflow,
    canAccessApprovalItem,
    canAccessApprovalAction,
    approvalOwnershipSql,
};
