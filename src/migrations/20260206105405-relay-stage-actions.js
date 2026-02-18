'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('relay_stage_actions', {
      relay_stage_action_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      relay_stage_id: {
        type: Sequelize.UUID, // Must match relay_stages.relay_stage_id
        allowNull: false,
        references: {
          model: 'relay_stages',
          key: 'relay_stage_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      action_type: {
        type: Sequelize.STRING(50),
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

    await queryInterface.addIndex(
      'relay_stage_actions',
      ['relay_stage_id'],
      { name: 'idx_relay_stage_actions_stage' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('relay_stage_actions');
  },
};
