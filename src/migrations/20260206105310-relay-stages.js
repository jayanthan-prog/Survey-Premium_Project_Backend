'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('relay_stages', {
      relay_stage_id: {
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

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('relay_stages');
  },
};
