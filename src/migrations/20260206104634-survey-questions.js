'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_questions',
      {
        question_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },

        survey_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
        },

        question_type: {
          type: Sequelize.STRING(30), // SINGLE | MULTI | TEXT | SCALE
          allowNull: false,
        },

        question_text: {
          type: Sequelize.TEXT,
          allowNull: false,
        },

        is_required: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },

        sort_order: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },

        config: {
          type: Sequelize.JSON,
          allowNull: false,
          defaultValue: {},
        },

        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    // ✅ ADD FK AFTER TABLE CREATION
    await queryInterface.addConstraint('survey_questions', {
      fields: ['survey_id'],
      type: 'foreign key',
      name: 'fk_questions_survey',
      references: {
        table: 'surveys',
        field: 'survey_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addIndex(
      'survey_questions',
      ['survey_id', 'sort_order'],
      { name: 'idx_questions_order' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_questions');
  },
};
