'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_sessions',
      {
        session_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },

        participant_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
        },

        started_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },

        last_activity_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },

        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true,
        },

        user_agent: {
          type: Sequelize.TEXT,
          allowNull: true,
        },

        session_data: {
          type: Sequelize.JSON,
          allowNull: false,
          defaultValue: {},
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    // ADD FK SEPARATELY (MySQL best practice)
    await queryInterface.addConstraint('survey_sessions', {
      fields: ['participant_id'],
      type: 'foreign key',
      name: 'fk_sessions_participant',
      references: {
        table: 'survey_participants',
        field: 'participant_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addIndex(
      'survey_sessions',
      ['participant_id'],
      { name: 'idx_session_participant' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_sessions');
  },
};
