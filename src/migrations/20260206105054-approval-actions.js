'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'approval_actions',
      {
        approval_action_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },

        approval_item_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          references: {
            model: 'approval_items',
            key: 'approval_item_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        step_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        acted_by_user_id: {
          type: Sequelize.CHAR(36),
          allowNull: true, // REQUIRED for SET NULL
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        action: {
          type: Sequelize.STRING(30), // APPROVE | REJECT | REQUEST_REUPLOAD | OVERRIDE
          allowNull: false,
        },

        comment: {
          type: Sequelize.TEXT,
          allowNull: true,
        },

        acted_at: {
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
      'approval_actions',
      ['approval_item_id'],
      { name: 'idx_approval_actions_item' }
    );

    await queryInterface.addIndex(
      'approval_actions',
      ['acted_by_user_id', 'acted_at'],
      { name: 'idx_approval_actions_user' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('approval_actions');
  },
};
