'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./users');
const Group = require('./group');

const GroupMember = sequelize.define('GroupMember', {
  group_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    primaryKey: true,
    references: { model: Group, key: 'group_id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  user_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    primaryKey: true,
    references: { model: User, key: 'user_id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  joined_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'group_members',
  timestamps: false,
});

module.exports = GroupMember;
