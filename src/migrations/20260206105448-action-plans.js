'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('action_plans', {
      action_plan_id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        defaultValue: Sequelize.literal('(UUID())'),
      },

      survey_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'surveys',
          key: 'survey_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      participant_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'survey_participants',
          key: 'participant_id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
      },

      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'PENDING',
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addIndex('action_plans', ['survey_id', 'participant_id'], {
      name: 'idx_action_plans_survey_participant',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('action_plans');
  },
};
