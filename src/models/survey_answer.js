const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database'); // your Sequelize instance

class SurveyAnswer extends Model {}

SurveyAnswer.init(
  {
    answer_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    participation_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'survey_participation',
        key: 'participation_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    question_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'survey_questions',
        key: 'question_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    value_json: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'SurveyAnswer',
    tableName: 'survey_answers',
    timestamps: false,
  }
);

module.exports = SurveyAnswer;
