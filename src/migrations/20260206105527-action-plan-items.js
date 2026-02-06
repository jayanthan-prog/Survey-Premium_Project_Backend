
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('action_plan_items', {
      item_id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('(UUID())'),
      },

      plan_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'action_plans',       // parent table
          key: 'action_plan_id',        // ✅ must match parent PK exactly
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      code: {
        type: Sequelize.STRING(50),
      },
      title: {
        type: Sequelize.STRING(150),
      },
      window_rules: {
        type: Sequelize.JSON,
      },
      dependency_rules: {
        type: Sequelize.JSON,
      },
      required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addIndex(
      'action_plan_items',
      ['plan_id'],
      { name: 'idx_action_plan_items_plan_id' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('action_plan_items');
  },
};
