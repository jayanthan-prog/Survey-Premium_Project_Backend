'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Group = sequelize.define(
  'Group',
  {
    group_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    attributes: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'groups',
    timestamps: false,
  }
);

module.exports = Group;
