'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'approval_items',
      {
        approval_item_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
        },

        approval_workflow_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'approval_workflows',
            key: 'approval_workflow_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        approval_step_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'approval_steps',
            key: 'approval_step_id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        entity_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },

        entity_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },

        status: {
          type: Sequelize.STRING(20), // PENDING | APPROVED | REJECTED
          allowNull: false,
          defaultValue: 'PENDING',
        },

        decided_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        decided_at: {
          type: Sequelize.DATE,
          allowNull: true,
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

    await queryInterface.addConstraint('approval_items', {
      fields: ['approval_workflow_id', 'entity_type', 'entity_id'],
      type: 'unique',
      name: 'uniq_workflow_entity_item',
    });

    await queryInterface.addIndex(
      'approval_items',
      ['approval_step_id', 'status'],
      { name: 'idx_step_status' }
    );

    await queryInterface.addIndex(
      'approval_items',
      ['entity_type', 'entity_id'],
      { name: 'idx_approval_items_entity' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('approval_items');
  },
};
