'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Sequelize instance

const AuditEvent = sequelize.define('AuditEvent', {
  event_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  user_id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
  survey_id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
  action_plan_id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
  event_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  event_details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'audit_events',
  timestamps: false,
});

// Associations
AuditEvent.associate = models => {
  AuditEvent.belongsTo(models.User, { foreignKey: 'user_id' });
  AuditEvent.belongsTo(models.Survey, { foreignKey: 'survey_id' });
  AuditEvent.belongsTo(models.ActionPlan, { foreignKey: 'action_plan_id' });
};

module.exports = AuditEvent;
