'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Survey = sequelize.define('Survey', {
  survey_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  code: { type: DataTypes.STRING, unique: true, allowNull: false },
  title: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('PICK_N', 'PRIORITY', 'WORKFLOW_RELAY', 'CALENDAR_SLOT', 'ACTION_PLAN', 'VERIFICATION', 'AUTH'), allowNull: false },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  status: { type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED'), defaultValue: 'DRAFT' },
  config: { type: DataTypes.JSON, defaultValue: {} },
  dsl_rules: { type: DataTypes.JSON },
  created_by: {
    type: DataTypes.CHAR(36),
    references: { model: 'users', key: 'user_id' },
    onDelete: 'SET NULL',
  },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'surveys',
  timestamps: false,
});

module.exports = Survey;
