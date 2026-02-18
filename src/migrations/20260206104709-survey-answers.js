'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_answers',
      {
        answer_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
        },

        participation_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'survey_participation',
            key: 'participation_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        question_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'survey_questions',
            key: 'question_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        value_json: {
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
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    // Prevent duplicate answers per question
    await queryInterface.addConstraint('survey_answers', {
      fields: ['participation_id', 'question_id'],
      type: 'unique',
      name: 'uq_answer_participation_question',
    });

    await queryInterface.addIndex('survey_answers', ['participation_id'], {
      name: 'idx_answers_participation',
    });

    await queryInterface.addIndex('survey_answers', ['question_id'], {
      name: 'idx_answers_question',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_answers');
  },
};
