'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('slot_bookings', {
      slot_booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      calendar_slot_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'calendar_slots',
          key: 'calendar_slot_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      participant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'survey_participants',
          key: 'participant_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      booked_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex(
      'slot_bookings',
      ['calendar_slot_id', 'participant_id'],
      { name: 'idx_slot_bookings_calendar_participant' }
    );

    // Optional but recommended: prevent duplicate booking of same slot by same participant
    await queryInterface.addConstraint('slot_bookings', {
      fields: ['calendar_slot_id', 'participant_id'],
      type: 'unique',
      name: 'uniq_slot_booking_per_participant',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('slot_bookings');
  },
};
