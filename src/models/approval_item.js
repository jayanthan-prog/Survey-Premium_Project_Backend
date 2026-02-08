'use strict';
module.exports = (sequelize, DataTypes) => {
  const ApprovalItem = sequelize.define('ApprovalItem', {
    approval_item_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    approval_step_id: { type: DataTypes.INTEGER },
    entity_type: { type: DataTypes.STRING },
    entity_id: { type: DataTypes.INTEGER },
    status: { type: DataTypes.STRING }
  }, { tableName: 'approval_items', timestamps: false });

  ApprovalItem.associate = (models) => {
    if(models.ApprovalStep) ApprovalItem.belongsTo(models.ApprovalStep, { foreignKey: 'approval_step_id' });
    if(models.ApprovalAction) ApprovalItem.hasMany(models.ApprovalAction, { foreignKey: 'approval_item_id' });
  };

  return ApprovalItem;
};
'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApprovalItem = sequelize.define('ApprovalItem', {
  approval_item_id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false, defaultValue: DataTypes.UUIDV4 },
  workflow_id: { type: DataTypes.CHAR(36), allowNull: false },
  participation_id: { type: DataTypes.CHAR(36), allowNull: true },
  selection_id: { type: DataTypes.CHAR(36), allowNull: true },
  document_id: { type: DataTypes.CHAR(36), allowNull: true },
  current_step_order: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.STRING(30), allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'approval_items', timestamps: false });

ApprovalItem.associate = (models) => {
  if (models && models.ApprovalWorkflow) ApprovalItem.belongsTo(models.ApprovalWorkflow, { foreignKey: 'workflow_id' });
};

module.exports = ApprovalItem;
