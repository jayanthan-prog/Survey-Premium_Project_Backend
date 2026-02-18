'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('survey_releases', {
      release_id: {
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

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      phase: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      opens_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      closes_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      is_frozen: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      release_config: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: Sequelize.literal('(JSON_OBJECT())'),
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
