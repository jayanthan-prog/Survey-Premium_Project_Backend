'use strict';
module.exports = (sequelize, DataTypes) => {
  const ApprovalWorkflow = sequelize.define('ApprovalWorkflow', {
    approval_workflow_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'approval_workflows', timestamps: false });

  ApprovalWorkflow.associate = (models) => {
    if(models.ApprovalStep) ApprovalWorkflow.hasMany(models.ApprovalStep, { foreignKey: 'approval_workflow_id' });
  };

  return ApprovalWorkflow;
};
'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApprovalWorkflow = sequelize.define('ApprovalWorkflow', {
  workflow_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  release_id: { type: DataTypes.CHAR(36), allowNull: true },
  scope: { type: DataTypes.STRING(30), allowNull: true },
  option_id: { type: DataTypes.CHAR(36), allowNull: true },
  name: { type: DataTypes.STRING(255), allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'approval_workflows', timestamps: false });

ApprovalWorkflow.associate = (models) => {
  if (models && models.SurveyRelease) ApprovalWorkflow.belongsTo(models.SurveyRelease, { foreignKey: 'release_id' });
};

module.exports = ApprovalWorkflow;
