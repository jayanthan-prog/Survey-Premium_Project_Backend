'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('slot_bookings', {
      slot_booking_id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        defaultValue: Sequelize.literal('(UUID())'),
      },

      calendar_slot_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'calendar_slots',
          key: 'calendar_slot_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      participant_id: {
        type: Sequelize.CHAR(36),
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addIndex(
      'slot_bookings',
      ['calendar_slot_id', 'participant_id'],
      { name: 'idx_slot_bookings_calendar_participant' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('slot_bookings');
  },
};
