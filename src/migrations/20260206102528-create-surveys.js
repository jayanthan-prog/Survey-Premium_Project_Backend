'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('surveys', {
      survey_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
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
        defaultValue: Sequelize.literal('(JSON_OBJECT())'),
      },

      dsl_rules: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      created_by: {
        type: Sequelize.UUID,
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
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addIndex('surveys', ['type', 'status'], {
      name: 'idx_surveys_type_status',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('surveys');

    // Important: clean ENUM types in MySQL (safe practice)
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_surveys_type;
    `).catch(() => {});
  },
};
