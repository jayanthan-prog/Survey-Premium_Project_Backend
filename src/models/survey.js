'use strict';

module.exports = (sequelize, DataTypes) => {
  const Survey = sequelize.define(
    'Survey',
    {
      survey_id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'surveys',
      timestamps: false,
    }
  );

  Survey.associate = (models) => {
    Survey.hasMany(models.SurveyQuestion, {
      foreignKey: 'survey_id',
    });
  };

  return Survey;
};
