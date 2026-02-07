const GroupMember = require('../models/group_member');

// GET all group members
exports.getAllGroupMembers = async (req, res) => {
  try {
    const members = await GroupMember.findAll();
    res.status(200).json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single member by group_id and user_id
exports.getGroupMember = async (req, res) => {
  const { group_id, user_id } = req.params;
  try {
    const member = await GroupMember.findOne({ where: { group_id, user_id } });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.status(200).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE member
exports.createGroupMember = async (req, res) => {
  const { group_id, user_id, joined_at } = req.body;
  try {
    const newMember = await GroupMember.create({ group_id, user_id, joined_at });
    res.status(201).json(newMember);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE member joined_at
exports.updateGroupMember = async (req, res) => {
  const { group_id, user_id } = req.params;
  const { joined_at } = req.body;
  try {
    const member = await GroupMember.findOne({ where: { group_id, user_id } });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    member.joined_at = joined_at;
    await member.save();
    res.status(200).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE member
exports.deleteGroupMember = async (req, res) => {
  const { group_id, user_id } = req.params;
  try {
    const deleted = await GroupMember.destroy({ where: { group_id, user_id } });
    if (!deleted) return res.status(404).json({ message: 'Member not found' });
    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
