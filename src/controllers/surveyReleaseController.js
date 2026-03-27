const { SurveyRelease } = require('../models');
const db = require('../models');
const { hasManageAccess, isApproverScoped, canAccessSurvey, canAccessRelease } = require('../utils/ownershipScope');

// GET all releases
exports.getAllSurveyReleases = async (req, res) => {
  try {
    if (!hasManageAccess(req)) {
      return res.status(403).json({ error: 'Only admin/approver can view survey releases' });
    }

    if (isApproverScoped(req)) {
      const [rows] = await db.sequelize.query(
        `SELECT sr.*
         FROM survey_releases sr
         INNER JOIN surveys s ON s.survey_id = sr.survey_id
         WHERE s.created_by = :currentUserId
         ORDER BY sr.created_at DESC`,
        { replacements: { currentUserId: req.userId } }
      );
      return res.json(rows || []);
    }

    const releases = await SurveyRelease.findAll({
      order: [['created_at', 'DESC']],
    });
    res.json(releases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch survey releases' });
  }
};

// GET release by ID
exports.getSurveyReleaseById = async (req, res) => {
  try {
    if (!hasManageAccess(req)) {
      return res.status(403).json({ error: 'Only admin/approver can view survey releases' });
    }

    const release = await SurveyRelease.findByPk(req.params.id);
    if (!release) {
      return res.status(404).json({ error: 'Survey release not found' });
    }

    if (isApproverScoped(req)) {
      const allowed = await canAccessRelease(req, db, req.params.id);
      if (!allowed) {
        return res.status(403).json({ error: 'Approvers can only access releases for their surveys' });
      }
    }

    res.json(release);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch survey release' });
  }
};

// CREATE release
exports.createSurveyRelease = async (req, res) => {
  try {
    if (!hasManageAccess(req)) {
      return res.status(403).json({ error: 'Only admin/approver can create survey releases' });
    }

    if (!req.body || !req.body.survey_id) {
      return res.status(400).json({ error: 'survey_id is required' });
    }

    if (isApproverScoped(req)) {
      const allowed = await canAccessSurvey(req, db, req.body.survey_id);
      if (!allowed) {
        return res.status(403).json({ error: 'Approvers can only create releases for their surveys' });
      }
    }

    const release = await SurveyRelease.create(req.body);
    res.status(201).json(release);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create survey release' });
  }
};

// UPDATE release
exports.updateSurveyRelease = async (req, res) => {
  try {
    if (!hasManageAccess(req)) {
      return res.status(403).json({ error: 'Only admin/approver can update survey releases' });
    }

    const release = await SurveyRelease.findByPk(req.params.id);
    if (!release) {
      return res.status(404).json({ error: 'Survey release not found' });
    }

    if (isApproverScoped(req)) {
      const allowed = await canAccessRelease(req, db, req.params.id);
      if (!allowed) {
        return res.status(403).json({ error: 'Approvers can only update releases for their surveys' });
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'survey_id')) {
        const nextAllowed = await canAccessSurvey(req, db, req.body.survey_id);
        if (!nextAllowed) {
          return res.status(403).json({ error: 'Approvers can only move releases to their surveys' });
        }
      }
    }

    await release.update(req.body);
    res.json(release);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update survey release' });
  }
};

// DELETE release
exports.deleteSurveyRelease = async (req, res) => {
  try {
    if (!hasManageAccess(req)) {
      return res.status(403).json({ error: 'Only admin/approver can delete survey releases' });
    }

    const release = await SurveyRelease.findByPk(req.params.id);
    if (!release) {
      return res.status(404).json({ error: 'Survey release not found' });
    }

    if (isApproverScoped(req)) {
      const allowed = await canAccessRelease(req, db, req.params.id);
      if (!allowed) {
        return res.status(403).json({ error: 'Approvers can only delete releases for their surveys' });
      }
    }

    await release.destroy();
    res.json({ message: 'Survey release deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete survey release' });
  }
};
