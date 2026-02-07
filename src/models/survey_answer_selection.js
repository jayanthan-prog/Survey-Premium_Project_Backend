'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Sequelize instance

const SurveyAnswerSelection = sequelize.define('SurveyAnswerSelection', {
  selection_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  answer_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  question_option_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  value: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'survey_answer_selections',
  timestamps: false,
});

// Associations
SurveyAnswerSelection.associate = models => {
  SurveyAnswerSelection.belongsTo(models.SurveyAnswer, { foreignKey: 'answer_id' });
  SurveyAnswerSelection.belongsTo(models.SurveyQuestionOption, { foreignKey: 'question_option_id' });
};

module.exports = SurveyAnswerSelection;
