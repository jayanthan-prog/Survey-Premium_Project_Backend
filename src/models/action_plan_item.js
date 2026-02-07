'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // make sure this points to your Sequelize instance

const ActionPlanItem = sequelize.define('ActionPlanItem', {
  item_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  plan_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(50),
  },
  title: {
    type: DataTypes.STRING(150),
  },
  window_rules: {
    type: DataTypes.JSON,
  },
  dependency_rules: {
    type: DataTypes.JSON,
  },
  required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'action_plan_items',
  timestamps: false,
});

// Associations
ActionPlanItem.associate = models => {
  ActionPlanItem.belongsTo(models.ActionPlan, { foreignKey: 'plan_id' });
};

module.exports = ActionPlanItem;
