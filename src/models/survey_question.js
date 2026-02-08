'use strict';

module.exports = (sequelize, DataTypes) => {
  const SurveyQuestion = sequelize.define(
    'SurveyQuestion',
    {
      question_id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      survey_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
      },
      question_type: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      config: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'survey_questions',
      timestamps: false,
    }
  );

  SurveyQuestion.associate = (models) => {
    SurveyQuestion.belongsTo(models.Survey, {
      foreignKey: 'survey_id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    SurveyQuestion.hasMany(models.SurveyQuestionOption, {
      foreignKey: 'question_id',
    });
  };

  return SurveyQuestion;
};
