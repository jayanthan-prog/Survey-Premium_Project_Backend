'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('surveys', {
      survey_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('(UUID())'),
      },

      code: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },

      title: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      type: {
        type: Sequelize.ENUM(
          'PICK_N',
          'PRIORITY',
          'WORKFLOW_RELAY',
          'CALENDAR_SLOT',
          'ACTION_PLAN',
          'VERIFICATION',
          'AUTH'
        ),
        allowNull: false,
      },

      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      status: {
        type: Sequelize.ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },

      config: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },

      dsl_rules: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      created_by: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        ),
      },
    });

    await queryInterface.addIndex('surveys', ['type', 'status'], {
      name: 'idx_surveys_type_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('surveys');
  },
};
