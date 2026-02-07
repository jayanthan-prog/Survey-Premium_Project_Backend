const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class SurveyQuestionOption extends Model {}

SurveyQuestionOption.init(
  {
    question_option_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
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
    option_text: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    meta: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      validate: {
        isJson(value) {
          try {
            JSON.parse(value);
          } catch (err) {
            throw new Error('meta must be valid JSON');
          }
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'SurveyQuestionOption',
    tableName: 'survey_question_options',
    timestamps: false,
  }
);

module.exports = SurveyQuestionOption;
