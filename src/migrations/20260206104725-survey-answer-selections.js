'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_answer_selections',
      {
        selection_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
        },

        answer_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'survey_answers',
            key: 'answer_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        question_option_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'survey_question_options',
            key: 'question_option_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        value: {
          type: Sequelize.STRING(255),
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
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    await queryInterface.addConstraint('survey_answer_selections', {
      fields: ['answer_id', 'question_option_id'],
      type: 'unique',
      name: 'uq_answer_selection_unique',
    });

    await queryInterface.addIndex(
      'survey_answer_selections',
      ['answer_id'],
      { name: 'idx_answer_selections_answer' }
    );

    await queryInterface.addIndex(
      'survey_answer_selections',
      ['question_option_id'],
      { name: 'idx_answer_selections_option' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_answer_selections');
  },
};
