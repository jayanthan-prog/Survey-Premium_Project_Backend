'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Sequelize instance

const SlotBooking = sequelize.define('SlotBooking', {
  slot_booking_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  calendar_slot_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  participant_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  booked_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'slot_bookings',
  timestamps: false,
});

// Associations
SlotBooking.associate = models => {
  SlotBooking.belongsTo(models.CalendarSlot, { foreignKey: 'calendar_slot_id' });
  SlotBooking.belongsTo(models.SurveyParticipant, { foreignKey: 'participant_id' });
};

module.exports = SlotBooking;
