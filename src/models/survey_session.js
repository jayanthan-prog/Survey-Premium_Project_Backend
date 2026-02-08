'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SurveySession = sequelize.define(
  'SurveySession',
  {
    session_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    participant_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    last_activity_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    session_data: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: 'survey_sessions',
    timestamps: false,
  }
);

SurveySession.associate = (models) => {
  if (models && models.SurveyParticipation) {
    SurveySession.belongsTo(models.SurveyParticipation, { foreignKey: 'participation_id' });
  }
};

module.exports = SurveySession;
