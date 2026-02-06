'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('survey_releases', {
      release_id: {
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

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      phase: {
        type: Sequelize.INTEGER,
      },

      opens_at: Sequelize.DATE,
      closes_at: Sequelize.DATE,

      is_frozen: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      release_config: {
        type: Sequelize.JSON,
        defaultValue: {},
      },

      created_by: {
        type: Sequelize.CHAR(36),
        references: {
          model: 'users',
          key: 'user_id',
        },
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

    await queryInterface.addIndex('survey_releases', ['survey_id', 'opens_at'], {
      name: 'idx_survey_releases_time',
    });

    await queryInterface.addIndex('survey_releases', ['is_frozen'], {
      name: 'idx_survey_releases_frozen',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_releases');
  },
};
