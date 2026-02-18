'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('action_plan_items', {
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      plan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'action_plans',
          key: 'action_plan_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      code: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      title: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },

      window_rules: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      dependency_rules: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      'action_plan_items',
      ['plan_id'],
      { name: 'idx_action_plan_items_plan_id' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('action_plan_items');
  },
};
