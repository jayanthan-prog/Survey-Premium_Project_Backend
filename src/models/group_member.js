'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Group = require('./Group');

const GroupMember = sequelize.define('GroupMember', {
  member_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  group_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    references: { model: Group, key: 'group_id' },
    onDelete: 'CASCADE',
  },
  user_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    references: { model: User, key: 'user_id' },
    onDelete: 'CASCADE',
  },
  role: { type: DataTypes.STRING, defaultValue: 'member' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'group_members',
  timestamps: false,
});

module.exports = GroupMember;
