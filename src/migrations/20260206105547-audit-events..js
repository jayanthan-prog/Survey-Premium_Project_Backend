'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_events', {
      event_id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('(UUID())'),
      },

      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      survey_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'surveys',
          key: 'survey_id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      action_plan_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'action_plans',
          key: 'action_plan_id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      event_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },

      event_details: {
        type: Sequelize.JSON,
        allowNull: true,
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

    // Indexes
    await queryInterface.addIndex('audit_events', ['user_id'], { name: 'idx_audit_user' });
    await queryInterface.addIndex('audit_events', ['survey_id'], { name: 'idx_audit_survey' });
    await queryInterface.addIndex('audit_events', ['action_plan_id'], { name: 'idx_audit_action_plan' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_events');
  },
};
