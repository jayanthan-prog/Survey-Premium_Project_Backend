'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'relay_instances',
      {
        relay_instance_id: {
          type: Sequelize.CHAR(36),
          primaryKey: true,
          allowNull: false,
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

        status: {
          type: Sequelize.STRING(30), // PENDING | RUNNING | COMPLETED | FAILED
          allowNull: false,
          defaultValue: 'PENDING',
        },

        started_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },

        completed_at: Sequelize.DATE,
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    await queryInterface.addIndex('relay_instances', ['relay_workflow_id'], {
      name: 'idx_relay_instances_workflow',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('relay_instances');
  },
};
