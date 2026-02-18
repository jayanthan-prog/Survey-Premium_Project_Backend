'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_participation',
      {
        participation_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
        },

        release_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'survey_releases', // adjust if different
            key: 'release_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        status: {
          type: Sequelize.STRING(30),
          allowNull: false,
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

    // Prevent duplicate participation
    await queryInterface.addConstraint('survey_participation', {
      fields: ['release_id', 'user_id'],
      type: 'unique',
      name: 'uq_participation_release_user',
    });

    // Useful indexes
    await queryInterface.addIndex(
      'survey_participation',
      ['status'],
      { name: 'idx_participation_status' }
    );

    await queryInterface.addIndex(
      'survey_participation',
      ['release_id'],
      { name: 'idx_participation_release' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_participation');
  },
};
