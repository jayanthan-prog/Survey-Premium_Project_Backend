'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('survey_release_audience', {
      release_audience_id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        defaultValue: Sequelize.literal('(UUID())'),
      },

      release_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'survey_releases',
          key: 'release_id',
        },
        onDelete: 'CASCADE',
      },

      audience_type: {
        type: Sequelize.STRING(20), // USER | GROUP | FILTER
        allowNull: false,
      },

      ref_id: {
        type: Sequelize.CHAR(36),
      },

      filter_expr: {
        type: Sequelize.JSON,
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

    await queryInterface.addIndex('survey_release_audience', ['release_id'], {
      name: 'idx_release_audience',
    });

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
