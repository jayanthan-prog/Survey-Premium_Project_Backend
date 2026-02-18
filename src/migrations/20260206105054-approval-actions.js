'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('approval_actions', {
      approval_action_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      approval_item_id: {
        type: Sequelize.UUID,
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
        type: Sequelize.UUID,
        allowNull: true,
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
        defaultValue: Sequelize.NOW,
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
