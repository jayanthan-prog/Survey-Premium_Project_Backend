'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('action_plans', {
      action_plan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      survey_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'surveys',
          key: 'survey_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      participant_id: {
        type: Sequelize.UUID,
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
        allowNull: true,
      },

      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
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
      'action_plans',
      ['survey_id', 'participant_id'],
      { name: 'idx_action_plans_survey_participant' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('action_plans');
  },
};
