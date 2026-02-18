'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'approval_workflows',
      {
        approval_workflow_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
        },

        entity_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },

        entity_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },

        requested_by: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        approved_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        status: {
          type: Sequelize.STRING(20), // PENDING | APPROVED | REJECTED
          allowNull: false,
          defaultValue: 'PENDING',
        },

        comments: {
          type: Sequelize.TEXT,
          allowNull: true,
        },

        requested_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },

        approved_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    await queryInterface.addIndex(
      'approval_workflows',
      ['entity_type', 'entity_id'],
      { name: 'idx_approval_entity' }
    );

    await queryInterface.addIndex(
      'approval_workflows',
      ['status', 'requested_at'],
      { name: 'idx_approval_status_time' }
    );

    await queryInterface.addIndex(
      'approval_workflows',
      ['requested_by'],
      { name: 'idx_approval_requested_by' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('approval_workflows');
  },
};
