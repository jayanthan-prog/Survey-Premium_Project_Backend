const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database'); // Sequelize instance

class SurveyOption extends Model {}

SurveyOption.init(
  {
    option_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
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
    parent_option_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'survey_options',
        key: 'option_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    label: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    option_meta: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      validate: {
        isJson(value) {
          if (value !== null) {
            try {
              JSON.parse(value);
            } catch (err) {
              throw new Error('option_meta must be valid JSON');
            }
          }
        },
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'SurveyOption',
    tableName: 'survey_options',
    timestamps: false,
  }
);

module.exports = SurveyOption;
