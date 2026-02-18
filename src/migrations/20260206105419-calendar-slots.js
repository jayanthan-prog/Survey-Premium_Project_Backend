'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('calendar_slots', {
      calendar_slot_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      survey_id: {
        type: Sequelize.UUID, // Must match surveys.survey_id
        allowNull: false,
        references: {
          model: 'surveys',
          key: 'survey_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      end_time: {
        type: Sequelize.DATE,
        allowNull: false,
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
      'calendar_slots',
      ['survey_id'],
      { name: 'idx_calendar_slots_survey' }
    );

    // Optional but recommended for time-range queries
    await queryInterface.addIndex(
      'calendar_slots',
      ['survey_id', 'start_time', 'end_time'],
      { name: 'idx_calendar_slots_time_range' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('calendar_slots');
  },
};
