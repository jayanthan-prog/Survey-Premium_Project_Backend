'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'survey_participants',
      {
        participant_id: {
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

        user_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        external_ref: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },

        status: {
          type: Sequelize.ENUM(
            'INVITED',
            'STARTED',
            'COMPLETED',
            'CANCELLED'
          ),
          allowNull: false,
          defaultValue: 'INVITED',
        },

        invited_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },

        completed_at: {
          type: Sequelize.DATE,
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

    // Prevent duplicate user participation
    await queryInterface.addConstraint('survey_participants', {
      fields: ['survey_id', 'user_id'],
      type: 'unique',
      name: 'uq_participant_survey_user',
    });

    // Optional: prevent duplicate external reference
    await queryInterface.addConstraint('survey_participants', {
      fields: ['survey_id', 'external_ref'],
      type: 'unique',
      name: 'uq_participant_survey_external',
    });

    await queryInterface.addIndex(
      'survey_participants',
      ['survey_id'],
      { name: 'idx_participant_survey' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('survey_participants');
  },
};
