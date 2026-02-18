'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('survey_release_audience', {
      release_audience_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      release_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'survey_releases',
          key: 'release_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      audience_type: {
        type: Sequelize.ENUM('USER', 'GROUP', 'FILTER'),
        allowNull: false,
      },

      ref_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      filter_expr: {
        type: Sequelize.JSON,
        allowNull: true,
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
      'survey_release_audience',
      ['release_id'],
      { name: 'idx_release_audience_release' }
    );

    await queryInterface.addIndex(
      'survey_release_audience',
      ['audience_type', 'ref_id'],
      { name: 'idx_release_audience_type' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_release_audience');
  },
};
