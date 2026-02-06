'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_participation',
      {
        participation_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },

        release_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
        },

        user_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
        },

        status: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },

        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_participation');
  },
};
