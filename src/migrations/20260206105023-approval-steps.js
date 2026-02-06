'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'approval_steps',
      {
        approval_step_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },

        approval_workflow_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          references: {
            model: 'approval_workflows',
            key: 'approval_workflow_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        step_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        approver_user_id: {
          type: Sequelize.CHAR(36),
          allowNull: true, // REQUIRED for SET NULL
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        status: {
          type: Sequelize.STRING(20), // PENDING | APPROVED | REJECTED | SKIPPED
          allowNull: false,
          defaultValue: 'PENDING',
        },

        acted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },

        comments: {
          type: Sequelize.TEXT,
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

    await queryInterface.addIndex(
      'approval_steps',
      ['approval_workflow_id', 'step_order'],
      {
        unique: true,
        name: 'uniq_workflow_step_order',
      }
    );

    await queryInterface.addIndex(
      'approval_steps',
      ['approver_user_id'],
      {
        name: 'idx_approval_step_approver',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('approval_steps');
  },
};
