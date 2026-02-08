'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Match migration: include survey_id, start_time, end_time, created_at
const CalendarSlot = sequelize.define(
  'CalendarSlot',
  {
    calendar_slot_id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    survey_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'calendar_slots',
    timestamps: false,
  }
);

CalendarSlot.associate = (models) => {
  if (models && models.Survey) {
    CalendarSlot.belongsTo(models.Survey, { foreignKey: 'survey_id' });
  }
};

module.exports = CalendarSlot;
