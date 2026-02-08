'use strict';

module.exports = (sequelize, DataTypes) => {
  const SurveyRelease = sequelize.define(
    'SurveyRelease',
    {
      release_id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },

      survey_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      phase: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      opens_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      closes_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      is_frozen: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },

      release_config: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      created_by: {
        type: DataTypes.CHAR(36),
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'survey_releases',
      timestamps: false,
    }
  );

  // ✅ Associations (SAFE now)
  SurveyRelease.associate = (models) => {
    SurveyRelease.belongsTo(models.Survey, {
      foreignKey: 'survey_id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    SurveyRelease.belongsTo(models.User, {
      foreignKey: 'created_by',
    });
  };

  return SurveyRelease;
};
