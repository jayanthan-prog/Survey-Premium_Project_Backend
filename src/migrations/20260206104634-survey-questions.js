'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_questions',
      {
        question_id: {
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

        question_type: {
          type: Sequelize.ENUM(
            'SINGLE',
            'MULTI',
            'TEXT',
            'SCALE'
          ),
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
      'survey_questions',
      ['survey_id', 'sort_order'],
      { name: 'idx_questions_order' }
    );

    // Optional strict ordering enforcement
    await queryInterface.addConstraint('survey_questions', {
      fields: ['survey_id', 'sort_order'],
      type: 'unique',
      name: 'uq_questions_survey_order',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_questions');
  },
};
