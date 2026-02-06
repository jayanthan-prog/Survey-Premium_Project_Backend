'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'approval_workflows',
      {
        approval_workflow_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },

        entity_type: {
          type: Sequelize.STRING(50), // SURVEY | RELEASE | OPTION | USER
          allowNull: false,
        },

        entity_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
        },

        requested_by: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        approved_by: {
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
      ['status'],
      { name: 'idx_approval_status' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('approval_workflows');
  },
};
