const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class SurveyParticipant extends Model {}

SurveyParticipant.init(
  {
    participant_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    survey_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'surveys',
        key: 'survey_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    external_ref: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'INVITED',
    },
    invited_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'SurveyParticipant',
    tableName: 'survey_participants',
    timestamps: false,
  }
);

module.exports = SurveyParticipant;
