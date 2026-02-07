'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Sequelize instance

const AuditLog = sequelize.define('AuditLog', {
  log_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  user_id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
  action_plan_id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
  action_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  action_details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'audit_logs',
  timestamps: false,
});

// Associations
AuditLog.associate = models => {
  AuditLog.belongsTo(models.User, { foreignKey: 'user_id' });
  AuditLog.belongsTo(models.ActionPlan, { foreignKey: 'action_plan_id' });
};

module.exports = AuditLog;
