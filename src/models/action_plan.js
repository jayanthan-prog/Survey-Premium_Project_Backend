'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // your Sequelize instance

const ActionPlan = sequelize.define('ActionPlan', {
  action_plan_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  survey_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  participant_id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'PENDING', // PENDING | COMPLETED | DROPPED etc.
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'action_plans',
  timestamps: false,
});

// Associations (guarded)
ActionPlan.associate = (models) => {
  if (models && models.Survey) {
    ActionPlan.belongsTo(models.Survey, { foreignKey: 'survey_id' });
  }

  if (models && models.SurveyParticipant) {
    ActionPlan.belongsTo(models.SurveyParticipant, { foreignKey: 'participant_id' });
  }

  if (models && models.ActionPlanItem) {
    ActionPlan.hasMany(models.ActionPlanItem, { foreignKey: 'plan_id' });
  }
};

module.exports = ActionPlan;
