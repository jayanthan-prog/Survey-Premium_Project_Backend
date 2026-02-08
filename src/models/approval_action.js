'use strict';
module.exports = (sequelize, DataTypes) => {
  const ApprovalAction = sequelize.define('ApprovalAction', {
    approval_action_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    approval_item_id: { type: DataTypes.INTEGER },
    actor_user_id: { type: DataTypes.INTEGER },
    action: { type: DataTypes.STRING },
    comment: { type: DataTypes.TEXT }
  }, { tableName: 'approval_actions', timestamps: false });

  ApprovalAction.associate = (models) => {
    if(models.ApprovalItem) ApprovalAction.belongsTo(models.ApprovalItem, { foreignKey: 'approval_item_id' });
    if(models.User) ApprovalAction.belongsTo(models.User, { foreignKey: 'actor_user_id' });
  };

  return ApprovalAction;
};
'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApprovalAction = sequelize.define('ApprovalAction', {
  approval_action_id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false, defaultValue: DataTypes.UUIDV4 },
  approval_item_id: { type: DataTypes.CHAR(36), allowNull: false },
  step_order: { type: DataTypes.INTEGER, allowNull: true },
  acted_by_user_id: { type: DataTypes.CHAR(36), allowNull: true },
  action: { type: DataTypes.STRING(30), allowNull: true },
  comment: { type: DataTypes.TEXT, allowNull: true },
  acted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'approval_actions', timestamps: false });

ApprovalAction.associate = (models) => {
  if (models && models.ApprovalItem) ApprovalAction.belongsTo(models.ApprovalItem, { foreignKey: 'approval_item_id' });
};

module.exports = ApprovalAction;
