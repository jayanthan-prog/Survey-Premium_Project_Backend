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
    field_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    value_json: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      validate: {
        isJson(value) {
          if (value !== null) {
            try {
              JSON.parse(value);
            } catch (err) {
              throw new Error('value_json must be valid JSON');
            }
          }
        },
      },
    },
    created_at: {
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
