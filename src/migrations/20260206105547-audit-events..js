'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_events', {
      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      survey_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'surveys',
          key: 'survey_id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      action_plan_id: {
        type: Sequelize.UUID,
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
        defaultValue: Sequelize.NOW,
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Indexes
    await queryInterface.addIndex('audit_events', ['user_id'], {
      name: 'idx_audit_user',
    });

    await queryInterface.addIndex('audit_events', ['survey_id'], {
      name: 'idx_audit_survey',
    });

    await queryInterface.addIndex('audit_events', ['action_plan_id'], {
      name: 'idx_audit_action_plan',
    });

    // Recommended for audit filtering
    await queryInterface.addIndex('audit_events', ['event_type'], {
      name: 'idx_audit_event_type',
    });

    await queryInterface.addIndex('audit_events', ['created_at'], {
      name: 'idx_audit_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_events');
  },
};
