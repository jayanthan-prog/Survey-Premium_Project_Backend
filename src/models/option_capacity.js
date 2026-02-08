'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OptionCapacity = sequelize.define(
  'OptionCapacity',
  {
    capacity_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    release_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    option_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    capacity_total: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    waitlist_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    hold_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'option_capacity',
    timestamps: false,
  }
);

OptionCapacity.associate = (models) => {
  if (models && models.SurveyRelease) {
    OptionCapacity.belongsTo(models.SurveyRelease, { foreignKey: 'release_id' });
  }
  if (models && models.SurveyOptions) {
    OptionCapacity.belongsTo(models.SurveyOptions, { foreignKey: 'option_id' });
  }
};

module.exports = OptionCapacity;
