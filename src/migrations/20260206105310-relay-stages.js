'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'relay_stages',
      {
        relay_stage_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },

        relay_workflow_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          references: {
            model: 'relay_workflows',
            key: 'relay_workflow_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },

        sort_order: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },

        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
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
    await queryInterface.dropTable('relay_stages');
  },
};
