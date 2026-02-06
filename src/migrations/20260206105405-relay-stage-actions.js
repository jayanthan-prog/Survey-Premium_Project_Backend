'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('relay_stage_actions', {
      relay_stage_action_id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        defaultValue: Sequelize.literal('(UUID())'),
      },

      relay_stage_id: {
        type: Sequelize.CHAR(36),  // ⚠️ Must match parent column exactly
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
        defaultValue: 0,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',         // ⚠️ Must be InnoDB for FKs
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
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
