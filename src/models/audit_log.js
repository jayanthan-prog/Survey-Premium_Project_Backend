'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Sequelize instance

// Align with migration: primary key is `audit_log_id` and actor field is `actor_user_id` etc.
const AuditLog = sequelize.define(
  'AuditLog',
  {
    audit_log_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    actor_user_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    old_value: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    new_value: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'audit_logs',
    timestamps: false,
  }
);

// Associations (guarded checks to avoid errors when related models aren't loaded)
AuditLog.associate = (models) => {
  if (models && models.User) {
    AuditLog.belongsTo(models.User, { foreignKey: 'actor_user_id' });
  }

  // NOTE: don't attach ActionPlan by foreign key here because the migration
  // for audit_logs does not include an `action_plan_id` column. Only keep
  // the actor (user) relation which matches the migration.
};

module.exports = AuditLog;
