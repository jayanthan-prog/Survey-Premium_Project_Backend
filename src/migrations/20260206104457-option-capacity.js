'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('option_capacity', {
      capacity_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      release_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'survey_releases',
          key: 'release_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      option_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'survey_options',
          key: 'option_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      capacity_total: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      waitlist_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      hold_seconds: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        ),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    // Unique per release + option
    await queryInterface.addConstraint('option_capacity', {
      fields: ['release_id', 'option_id'],
      type: 'unique',
      name: 'uniq_capacity_release_option',
    });

    // Helpful index
    await queryInterface.addIndex(
      'option_capacity',
      ['release_id'],
      { name: 'idx_capacity_release' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('option_capacity');
  },
};
