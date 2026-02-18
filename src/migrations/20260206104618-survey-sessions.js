'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_sessions',
      {
        session_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
        },

        participant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'survey_participants',
            key: 'participant_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
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

        expires_at: {
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
      'survey_sessions',
      ['participant_id'],
      { name: 'idx_session_participant' }
    );

    await queryInterface.addIndex(
      'survey_sessions',
      ['expires_at'],
      { name: 'idx_session_expiry' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_sessions');
  },
};
