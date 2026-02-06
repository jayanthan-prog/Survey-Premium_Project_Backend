'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_participants',
      {
        participant_id: {
          type: Sequelize.CHAR(36),
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal('(UUID())'),
        },

        survey_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          references: {
            model: 'surveys',
            key: 'survey_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        user_id: {
          type: Sequelize.CHAR(36),
          allowNull: true,              // 🔥 REQUIRED
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        external_ref: {
          type: Sequelize.STRING(255),
        },

        status: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'INVITED',
        },

        invited_at: {
          type: Sequelize.DATE,
        },

        completed_at: {
          type: Sequelize.DATE,
        },

        meta: {
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

    await queryInterface.addIndex(
      'survey_participants',
      ['survey_id', 'user_id'],
      { name: 'idx_participant_user' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_participants');
  },
};
