'use strict';
module.exports = (sequelize, DataTypes) => {
  const SurveyParticipant = sequelize.define('SurveyParticipant', {
    participant_id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: sequelize.literal('(UUID())') },
    survey_id: { type: DataTypes.CHAR(36), allowNull: false },
    user_id: { type: DataTypes.CHAR(36) },
    external_ref: DataTypes.STRING,
    status: { type: DataTypes.STRING, defaultValue: 'INVITED' },
    invited_at: DataTypes.DATE,
    completed_at: DataTypes.DATE,
    meta: { type: DataTypes.JSON, defaultValue: {} },
    created_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
  }, { tableName: 'survey_participants', timestamps: false });

  SurveyParticipant.associate = models => {
    SurveyParticipant.belongsTo(models.Survey, { foreignKey: 'survey_id' });
    SurveyParticipant.belongsTo(models.User, { foreignKey: 'user_id' });
    SurveyParticipant.hasMany(models.ActionPlan, { foreignKey: 'participant_id' });
  };

  return SurveyParticipant;
};
