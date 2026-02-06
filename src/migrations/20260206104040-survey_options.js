'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('survey_options', {
      option_id: {
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
      },

      parent_option_id: {
        type: Sequelize.CHAR(36),
        references: {
          model: 'survey_options',
          key: 'option_id',
        },
      },

      code: {
        type: Sequelize.STRING(100),
      },

      label: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      description: Sequelize.TEXT,

      sort_order: Sequelize.INTEGER,

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      option_meta: {
        type: Sequelize.JSON,
        defaultValue: {},
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
