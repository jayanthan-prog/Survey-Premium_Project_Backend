'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('relay_instances', {
      relay_instance_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      relay_workflow_id: {
        type: Sequelize.UUID,
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
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },

      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
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
      'relay_instances',
      ['relay_workflow_id'],
      { name: 'idx_relay_instances_workflow' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('relay_instances');
  },
};
