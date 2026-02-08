'use strict';
module.exports = (sequelize, DataTypes) => {
  const ApprovalStep = sequelize.define('ApprovalStep', {
    approval_step_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    approval_workflow_id: { type: DataTypes.INTEGER },
    name: { type: DataTypes.STRING },
    step_order: { type: DataTypes.INTEGER }
  }, { tableName: 'approval_steps', timestamps: false });

  ApprovalStep.associate = (models) => {
    if(models.ApprovalWorkflow) ApprovalStep.belongsTo(models.ApprovalWorkflow, { foreignKey: 'approval_workflow_id' });
    if(models.ApprovalItem) ApprovalStep.hasMany(models.ApprovalItem, { foreignKey: 'approval_step_id' });
  };

  return ApprovalStep;
};
'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApprovalStep = sequelize.define('ApprovalStep', {
  step_id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false, defaultValue: DataTypes.UUIDV4 },
  workflow_id: { type: DataTypes.CHAR(36), allowNull: false },
  step_order: { type: DataTypes.INTEGER, allowNull: false },
  approver_type: { type: DataTypes.STRING(20), allowNull: true },
  approver_ref_id: { type: DataTypes.CHAR(36), allowNull: true },
  sla_hours: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'approval_steps', timestamps: false });

ApprovalStep.associate = (models) => {
  if (models && models.ApprovalWorkflow) ApprovalStep.belongsTo(models.ApprovalWorkflow, { foreignKey: 'workflow_id' });
};

module.exports = ApprovalStep;
