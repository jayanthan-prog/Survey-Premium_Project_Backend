'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_question_options',
      {
        question_option_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
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
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    await queryInterface.addIndex(
      'survey_question_options',
      ['question_id', 'sort_order'],
      { name: 'idx_question_options_order' }
    );

    // Optional: enforce unique ordering per question
    await queryInterface.addConstraint('survey_question_options', {
      fields: ['question_id', 'sort_order'],
      type: 'unique',
      name: 'uq_question_option_order',
    });

    // Optional: enforce unique value per question
    await queryInterface.addConstraint('survey_question_options', {
      fields: ['question_id', 'value'],
      type: 'unique',
      name: 'uq_question_option_value',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_question_options');
  },
};
