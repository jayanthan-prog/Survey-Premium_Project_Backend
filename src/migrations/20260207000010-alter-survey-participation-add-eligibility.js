'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add eligibility_status field
    await queryInterface.addColumn('survey_participation', 'eligibility_status', {
      type: Sequelize.ENUM('ELIGIBLE', 'INELIGIBLE', 'ELIGIBLE_WITH_REQUIREMENTS'),
      allowNull: true,
      comment: 'Eligibility evaluation result',
    });

    // Add eligibility_reason field
    await queryInterface.addColumn('survey_participation', 'eligibility_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Why user is ineligible or has conditions',
    });

    // Add started_at field
    await queryInterface.addColumn('survey_participation', 'started_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When user first opened the survey',
    });

    // Add submitted_at field
    await queryInterface.addColumn('survey_participation', 'submitted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When user submitted the survey',
    });

    // Add approved_at field
    await queryInterface.addColumn('survey_participation', 'approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When survey was approved',
    });

    // Add rejected_at field
    await queryInterface.addColumn('survey_participation', 'rejected_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When survey was rejected',
    });

    // Add locked_at field
    await queryInterface.addColumn('survey_participation', 'locked_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When participation was frozen/locked',
    });

    // Add meta field for extra data
    await queryInterface.addColumn('survey_participation', 'meta', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: Sequelize.literal('(JSON_OBJECT())'),
      comment: 'Progress, attempts count, etc.',
    });

    // Add indexes
    await queryInterface.addIndex('survey_participation', ['eligibility_status'], { name: 'idx_participation_eligibility' });
    await queryInterface.addIndex('survey_participation', ['user_id', 'status'], { name: 'idx_participation_user_status' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('survey_participation', 'eligibility_status');
    await queryInterface.removeColumn('survey_participation', 'eligibility_reason');
    await queryInterface.removeColumn('survey_participation', 'started_at');
    await queryInterface.removeColumn('survey_participation', 'submitted_at');
    await queryInterface.removeColumn('survey_participation', 'approved_at');
    await queryInterface.removeColumn('survey_participation', 'rejected_at');
    await queryInterface.removeColumn('survey_participation', 'locked_at');
    await queryInterface.removeColumn('survey_participation', 'meta');
  },
};
