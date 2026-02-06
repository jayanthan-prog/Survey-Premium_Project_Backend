'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('option_capacity', {
      capacity_id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        defaultValue: Sequelize.literal('(UUID())'),
      },

      release_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'survey_releases',
          key: 'release_id',
        },
        onDelete: 'CASCADE',
      },

      option_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'survey_options',
          key: 'option_id',
        },
        onDelete: 'CASCADE',
      },

      capacity_total: Sequelize.INTEGER,

      waitlist_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      hold_seconds: Sequelize.INTEGER,

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addConstraint('option_capacity', {
      fields: ['release_id', 'option_id'],
      type: 'unique',
      name: 'uniq_capacity_release_option',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('option_capacity');
  },
};
