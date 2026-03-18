'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupMember = sequelize.define(
  'GroupMember',
  {
    group_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    role_in_group: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'group_members',
    timestamps: false,
  }
);

module.exports = GroupMember;
