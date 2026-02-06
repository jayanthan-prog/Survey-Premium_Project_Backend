'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_answers',
      {
        answer_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },

        participation_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
        },

        field_key: {
          type: Sequelize.STRING(100),
          allowNull: false,
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
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    // ✅ ADD FK AFTER TABLE EXISTS
    await queryInterface.addConstraint('survey_answers', {
      fields: ['participation_id'],
      type: 'foreign key',
      name: 'fk_answers_participation',
      references: {
        table: 'survey_participation',
        field: 'participation_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addIndex('survey_answers', ['participation_id'], {
      name: 'idx_answers_participation',
    });

    await queryInterface.addIndex('survey_answers', ['field_key'], {
      name: 'idx_answers_field',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_answers');
  },
};
