'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('survey_dependencies', {
      dependency_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      child_survey_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'surveys',
          key: 'survey_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Survey-2 (the dependent survey)',
      },

      parent_survey_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'surveys',
          key: 'survey_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Survey-1 (the prerequisite survey)',
      },

      rule_type: {
        type: Sequelize.ENUM('HARD', 'SOFT'),
        allowNull: false,
        defaultValue: 'HARD',
        comment: 'HARD = Survey-2 not visible unless condition met; SOFT = visible but shows warning',
      },

      required_state: {
        type: Sequelize.ENUM('ATTEMPTED', 'SUBMITTED', 'APPROVED'),
        allowNull: false,
        defaultValue: 'APPROVED',
        comment: 'What state must Survey-1 be in?',
      },

      reentry_allowed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Can user reattempt parent survey if failed?',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addIndex('survey_dependencies', ['child_survey_id'], { name: 'idx_survey_dep_child' });
    await queryInterface.addIndex('survey_dependencies', ['parent_survey_id'], { name: 'idx_survey_dep_parent' });

    // Prevent circular dependencies (basic check)
    await queryInterface.addConstraint('survey_dependencies', {
      fields: ['child_survey_id', 'parent_survey_id'],
      type: 'unique',
      name: 'uq_survey_dependency_pair',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('survey_dependencies');
  },
};
