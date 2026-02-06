'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_question_options',
      {
        question_option_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },

        question_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
        },

        option_text: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },

        value: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },

        sort_order: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },

        meta: {
          type: Sequelize.JSON,
          allowNull: false,
          defaultValue: {},
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    // ✅ ADD FK AFTER TABLE CREATION
    await queryInterface.addConstraint('survey_question_options', {
      fields: ['question_id'],
      type: 'foreign key',
      name: 'fk_question_options_question',
      references: {
        table: 'survey_questions',
        field: 'question_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addIndex(
      'survey_question_options',
      ['question_id', 'sort_order'],
      { name: 'idx_question_options_order' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_question_options');
  },
};
