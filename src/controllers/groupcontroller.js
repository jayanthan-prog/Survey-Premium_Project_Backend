const db = require('../models');

const { Group, GroupMember, User } = db;

function normalizeIdList(values) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  );
}

function buildGroupPayload(group, members) {
  const attributes = group.attributes || {};
  const approvers = (members || []).filter((member) => String(member.role_in_group || '').toUpperCase() === 'APPROVER');
  const participants = (members || []).filter((member) => String(member.role_in_group || '').toUpperCase() !== 'APPROVER');

  return {
    group_id: group.group_id,
    name: group.name,
    type: group.type || null,
    created_at: group.created_at,
    updated_at: group.updated_at,
    attributes,
    description: attributes.description || '',
    task: attributes.task || '',
    is_active: attributes.is_active !== false,
    created_by_name: attributes.created_by_name || null,
    member_count: members.length,
    approver_count: approvers.length,
    participant_count: participants.length,
    approvers: approvers.map((member) => ({
      user_id: Number(member.user_id),
      name: member.user_name,
      email: member.user_email,
      role_in_group: member.role_in_group,
      joined_at: member.joined_at,
    })),
    participants: participants.map((member) => ({
      user_id: Number(member.user_id),
      name: member.user_name,
      email: member.user_email,
      role_in_group: member.role_in_group,
      joined_at: member.joined_at,
    })),
  };
}

async function getNextGroupId() {
  const [rows] = await db.sequelize.query('SELECT COALESCE(MAX(group_id), 0) + 1 AS nextGroupId FROM `groups`');
  return Number(rows && rows[0] ? rows[0].nextGroupId : 1);
}

async function getGroupMembers(groupId, transaction) {
  const [rows] = await db.sequelize.query(
    `SELECT gm.group_id, gm.user_id, gm.role_in_group, gm.joined_at, u.name AS user_name, u.email AS user_email
     FROM group_members gm
     JOIN users u ON u.user_id = gm.user_id
     WHERE gm.group_id = :groupId
     ORDER BY CASE WHEN UPPER(COALESCE(gm.role_in_group, '')) = 'APPROVER' THEN 0 ELSE 1 END, u.name ASC`,
    {
      replacements: { groupId },
      transaction,
    }
  );

  return rows || [];
}

async function syncGroupMembers(groupId, approverIds, participantIds, transaction) {
  const roleMap = new Map();

  for (const userId of normalizeIdList(participantIds)) {
    roleMap.set(userId, 'PARTICIPANT');
  }

  for (const userId of normalizeIdList(approverIds)) {
    roleMap.set(userId, 'APPROVER');
  }

  const userIds = Array.from(roleMap.keys());
  if (userIds.length) {
    const existingUsers = await User.findAll({
      where: { user_id: userIds },
      attributes: ['user_id', 'is_active'],
      transaction,
    });

    const foundIds = new Set(existingUsers.map((user) => Number(user.user_id)));
    const missing = userIds.filter((userId) => !foundIds.has(userId));
    if (missing.length) {
      const error = new Error(`Unknown users: ${missing.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const frozenUsers = existingUsers
      .filter((entry) => entry.is_active === false)
      .map((entry) => Number(entry.user_id));
    if (frozenUsers.length) {
      const error = new Error(`Inactive users cannot be assigned to groups: ${frozenUsers.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
  }

  await GroupMember.destroy({ where: { group_id: groupId }, transaction });

  if (!roleMap.size) {
    return;
  }

  await GroupMember.bulkCreate(
    Array.from(roleMap.entries()).map(([userId, role]) => ({
      group_id: groupId,
      user_id: userId,
      role_in_group: role,
      joined_at: new Date(),
    })),
    { transaction }
  );
}

exports.getAllGroups = async (req, res) => {
  try {
    const includeInactive = String(req.query?.includeInactive || '').toLowerCase() === 'true';
    const groups = await Group.findAll({ order: [['created_at', 'DESC']] });
    const visibleGroups = includeInactive
      ? groups
      : groups.filter((group) => (group.attributes || {}).is_active !== false);
    const membersByGroupId = new Map();

    const [memberRows] = await db.sequelize.query(
      `SELECT gm.group_id, gm.user_id, gm.role_in_group, gm.joined_at, u.name AS user_name, u.email AS user_email
       FROM group_members gm
       JOIN users u ON u.user_id = gm.user_id
       ORDER BY gm.joined_at DESC`
    );

    for (const row of memberRows || []) {
      const key = Number(row.group_id);
      const existing = membersByGroupId.get(key) || [];
      existing.push(row);
      membersByGroupId.set(key, existing);
    }

    res.json(
      visibleGroups.map((group) => buildGroupPayload(group, membersByGroupId.get(Number(group.group_id)) || []))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const members = await getGroupMembers(group.group_id);
    res.json(buildGroupPayload(group, members));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

exports.createGroup = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Group name is required' });
    }

    const groupId = await getNextGroupId();
    const attributes = {
      ...(req.body?.attributes || {}),
      description: req.body?.description || '',
      task: req.body?.task || '',
      is_active: req.body?.is_active !== false,
      created_by_user_id: req.userId,
      created_by_name: req.body?.created_by_name || null,
    };

    const group = await Group.create(
      {
        group_id: groupId,
        name,
        type: req.body?.type || null,
        attributes,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction }
    );

    await syncGroupMembers(groupId, req.body?.approver_user_ids, req.body?.participant_user_ids, transaction);
    await transaction.commit();

    const members = await getGroupMembers(groupId);
    res.status(201).json(buildGroupPayload(group, members));
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

exports.updateGroup = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const group = await Group.findByPk(req.params.id, { transaction });
    if (!group) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Group not found' });
    }

    const name = String(req.body?.name || group.name || '').trim();
    if (!name) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Group name is required' });
    }

    const nextAttributes = {
      ...(group.attributes || {}),
      ...(req.body?.attributes || {}),
      description: Object.prototype.hasOwnProperty.call(req.body || {}, 'description') ? (req.body?.description || '') : ((group.attributes || {}).description || ''),
      task: Object.prototype.hasOwnProperty.call(req.body || {}, 'task') ? (req.body?.task || '') : ((group.attributes || {}).task || ''),
      is_active: Object.prototype.hasOwnProperty.call(req.body || {}, 'is_active') ? req.body?.is_active !== false : ((group.attributes || {}).is_active !== false),
      created_by_user_id: (group.attributes || {}).created_by_user_id || req.userId,
      created_by_name: req.body?.created_by_name || (group.attributes || {}).created_by_name || null,
    };

    await group.update(
      {
        name,
        type: Object.prototype.hasOwnProperty.call(req.body || {}, 'type') ? (req.body?.type || null) : group.type,
        attributes: nextAttributes,
        updated_at: new Date(),
      },
      { transaction }
    );

    await syncGroupMembers(group.group_id, req.body?.approver_user_ids, req.body?.participant_user_ids, transaction);
    await transaction.commit();

    const members = await getGroupMembers(group.group_id);
    res.json(buildGroupPayload(group, members));
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

exports.deleteGroup = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const group = await Group.findByPk(req.params.id, { transaction });
    if (!group) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Group not found' });
    }

    await GroupMember.destroy({ where: { group_id: group.group_id }, transaction });
    await group.destroy({ transaction });
    await transaction.commit();

    res.json({ message: 'Group deleted successfully', group_id: Number(req.params.id) });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
