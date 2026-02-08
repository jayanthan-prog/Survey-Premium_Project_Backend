'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SurveyReleaseAudience = sequelize.define(
  'SurveyReleaseAudience',
  {
    release_audience_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    release_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    audience_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    ref_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    filter_expr: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'survey_release_audience',
    timestamps: false,
  }
);

SurveyReleaseAudience.associate = (models) => {
  if (models && models.SurveyRelease) {
    SurveyReleaseAudience.belongsTo(models.SurveyRelease, { foreignKey: 'release_id' });
  }
};

module.exports = SurveyReleaseAudience;
