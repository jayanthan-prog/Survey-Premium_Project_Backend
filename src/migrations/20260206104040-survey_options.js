'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('survey_options', {
      option_id: {
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

      parent_option_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'survey_options',
          key: 'option_id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },

      code: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      label: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      option_meta: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: Sequelize.literal('(JSON_OBJECT())'),
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

    await queryInterface.addIndex(
      'survey_options',
      ['survey_id', 'code'],
      { unique: true }
    );

    await queryInterface.addIndex(
      'survey_options',
      ['survey_id', 'sort_order'],
      { name: 'idx_survey_options_order' }
    );

    await queryInterface.addIndex(
      'survey_options',
      ['parent_option_id'],
      { name: 'idx_survey_options_parent' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_options');
  },
};
