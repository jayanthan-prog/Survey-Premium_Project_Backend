'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CalendarSlot = sequelize.define('CalendarSlot', {
  calendar_slot_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'calendar_slots',
  timestamps: false,
});

module.exports = CalendarSlot;
