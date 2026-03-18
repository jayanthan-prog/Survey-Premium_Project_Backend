const db = require('../models');
const { User } = db;
const { getPrimaryRole, resolveUserRoles } = require('../utils/authRoles');

async function ensureRoleId(roleName, transaction) {
  const normalizedRole = String(roleName || 'USER').trim().toUpperCase() || 'USER';

  const [existingRows] = await db.sequelize.query(
    'SELECT role_id FROM roles WHERE UPPER(name) = UPPER(:roleName) LIMIT 1',
    {
      replacements: { roleName: normalizedRole },
      transaction,
    }
  );

  if (existingRows && existingRows[0]) {
    return Number(existingRows[0].role_id);
  }

  const [maxRows] = await db.sequelize.query(
    'SELECT COALESCE(MAX(role_id), 0) + 1 AS nextRoleId FROM roles',
    { transaction }
  );
  const roleId = Number(maxRows && maxRows[0] ? maxRows[0].nextRoleId : 1);

  await db.sequelize.query(
    `INSERT INTO roles (role_id, name, description, created_at, updated_at)
     VALUES (:roleId, :roleName, :description, NOW(), NOW())`,
    {
      replacements: {
        roleId,
        roleName: normalizedRole,
        description: `${normalizedRole} access role`,
      },
      transaction,
    }
  );

  return roleId;
}

async function scalarCountSafe(sql, replacements = {}) {
  try {
    const [rows] = await db.sequelize.query(sql, { replacements });
    const row = rows && rows[0] ? rows[0] : {};
    const value = row.countValue ?? row.count ?? row.total ?? 0;
    return Number(value || 0);
  } catch (_error) {
    return 0;
  }
}

function toIsoOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function buildActivityItem(type, title, description, occurredAt, extra = {}) {
  return {
    type,
    title,
    description,
    occurred_at: toIsoOrNull(occurredAt),
    ...extra,
  };
}

exports.getAllUsers = async (req, res) => {
  try {
    const includeInactive = String(req.query?.includeInactive || '').toLowerCase() === 'true';
    const users = await User.findAll({
      where: includeInactive ? {} : { is_active: true },
      order: [['created_at', 'DESC']],
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const roles = await resolveUserRoles(user.user_id);
    const primaryRole = getPrimaryRole(roles);

    const [
      signInCount,
      activeTokenCount,
      surveyParticipationCount,
      completedSurveyCount,
      answerCount,
      actionPlanCount,
      bookingCount,
    ] = await Promise.all([
      scalarCountSafe('SELECT COUNT(*) AS countValue FROM auth_tokens WHERE user_id = :userId', { userId: user.user_id }),
      scalarCountSafe('SELECT COUNT(*) AS countValue FROM auth_tokens WHERE user_id = :userId AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at >= NOW())', { userId: user.user_id }),
      scalarCountSafe('SELECT COUNT(*) AS countValue FROM survey_participants WHERE user_id = :userId', { userId: user.user_id }),
      scalarCountSafe("SELECT COUNT(*) AS countValue FROM survey_participants WHERE user_id = :userId AND status = 'COMPLETED'", { userId: user.user_id }),
      scalarCountSafe('SELECT COUNT(*) AS countValue FROM survey_answers sa JOIN survey_participants sp ON sa.participation_id = sp.participant_id WHERE sp.user_id = :userId', { userId: user.user_id }),
      scalarCountSafe('SELECT COUNT(*) AS countValue FROM action_plans ap JOIN survey_participants sp ON ap.participant_id = sp.participant_id WHERE sp.user_id = :userId', { userId: user.user_id }),
      scalarCountSafe('SELECT COUNT(*) AS countValue FROM slot_bookings sb JOIN survey_participants sp ON sb.participant_id = sp.participant_id WHERE sp.user_id = :userId', { userId: user.user_id }),
    ]);

    const [tokenRows] = await db.sequelize.query(
      `SELECT auth_token_id, token_type, created_at, expires_at, revoked_at
       FROM auth_tokens
       WHERE user_id = :userId
       ORDER BY created_at DESC
       LIMIT 5`,
      { replacements: { userId: user.user_id } }
    );

    const [auditLogRows] = await db.sequelize.query(
      `SELECT audit_log_id, entity_type, entity_id, action, created_at
       FROM audit_logs
       WHERE actor_user_id = :userId OR (UPPER(entity_type) = 'USER' AND entity_id = :userId)
       ORDER BY created_at DESC
       LIMIT 10`,
      { replacements: { userId: user.user_id } }
    );

    const [auditEventRows] = await db.sequelize.query(
      `SELECT event_id, event_type, event_details, created_at
       FROM audit_events
       WHERE user_id = :userId
       ORDER BY created_at DESC
       LIMIT 10`,
      { replacements: { userId: user.user_id } }
    );

    const [participantRows] = await db.sequelize.query(
      `SELECT participant_id, survey_id, status, invited_at, completed_at, created_at, updated_at
       FROM survey_participants
       WHERE user_id = :userId
       ORDER BY COALESCE(updated_at, created_at) DESC
       LIMIT 10`,
      { replacements: { userId: user.user_id } }
    );

    const activity = [
      ...((tokenRows || []).map((row) =>
        buildActivityItem(
          'LOGIN',
          'Signed in',
          `Bearer session issued${row.revoked_at ? ' and later revoked' : ''}.`,
          row.created_at,
          {
            reference_id: row.auth_token_id,
            metadata: {
              token_type: row.token_type,
              expires_at: toIsoOrNull(row.expires_at),
              revoked_at: toIsoOrNull(row.revoked_at),
            },
          }
        )
      )),
      ...((auditLogRows || []).map((row) =>
        buildActivityItem(
          'AUDIT_LOG',
          `${row.action} ${row.entity_type}`,
          `Audit log recorded for ${String(row.entity_type || 'entity').toLowerCase()}.`,
          row.created_at,
          { reference_id: row.audit_log_id, metadata: { entity_id: row.entity_id } }
        )
      )),
      ...((auditEventRows || []).map((row) =>
        buildActivityItem(
          'AUDIT_EVENT',
          row.event_type,
          row.event_details?.summary || row.event_details?.description || 'Tracked audit event.',
          row.created_at,
          { reference_id: row.event_id, metadata: row.event_details || {} }
        )
      )),
      ...((participantRows || []).map((row) =>
        buildActivityItem(
          'SURVEY_PARTICIPATION',
          `Survey ${row.status}`,
          `Participant record for survey #${row.survey_id}.`,
          row.completed_at || row.updated_at || row.invited_at || row.created_at,
          {
            reference_id: row.participant_id,
            metadata: {
              survey_id: row.survey_id,
              status: row.status,
              invited_at: toIsoOrNull(row.invited_at),
              completed_at: toIsoOrNull(row.completed_at),
            },
          }
        )
      )),
    ]
      .filter((item) => item.occurred_at)
      .sort((left, right) => new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime())
      .slice(0, 12);

    res.json({
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        is_active: Boolean(user.is_active),
        category: user.category || null,
        year: user.year ?? null,
        section: user.section || null,
        department: user.department || null,
        rank: user.rank ?? null,
        score: user.score ?? null,
        attributes: user.attributes || {},
        created_at: toIsoOrNull(user.created_at),
        updated_at: toIsoOrNull(user.updated_at),
        role: primaryRole,
        roles,
      },
      summary: {
        sign_in_count: signInCount,
        active_sessions: activeTokenCount,
        survey_participations: surveyParticipationCount,
        surveys_completed: completedSurveyCount,
        answers_submitted: answerCount,
        action_plans: actionPlanCount,
        slot_bookings: bookingCount,
      },
      activity,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createUser = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const requestedRole = String(req.body?.role || 'USER').trim().toUpperCase() || 'USER';
    const payload = {
      name: req.body?.name,
      email: req.body?.email,
      phone: req.body?.phone,
      is_active: Object.prototype.hasOwnProperty.call(req.body || {}, 'is_active') ? req.body.is_active : true,
      category: req.body?.category,
      year: req.body?.year,
      section: req.body?.section,
      department: req.body?.department,
      rank: req.body?.rank,
      score: req.body?.score,
      attributes: Object.prototype.hasOwnProperty.call(req.body || {}, 'attributes') ? req.body.attributes : {},
    };

    const created = await User.create(payload, { transaction });
    const roleId = await ensureRoleId(requestedRole, transaction);

    await db.sequelize.query(
      'INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (:userId, :roleId, NOW())',
      {
        replacements: {
          userId: created.user_id,
          roleId,
        },
        transaction,
      }
    );

    await transaction.commit();
    res.status(201).json(created);
  } catch (e) {
    await transaction.rollback();
    res.status(500).json({ error: e.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.update(req.body);
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
