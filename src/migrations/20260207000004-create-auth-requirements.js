'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auth_requirements', {
      auth_req_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      release_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'survey_releases',
          key: 'release_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      option_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'survey_options',
          key: 'option_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'If null, applies to entire survey; if set, applies to specific option',
      },

      required_before: {
        type: Sequelize.ENUM('OPEN', 'SUBMIT', 'APPROVE', 'CONFIRM'),
        allowNull: false,
        comment: 'When must this auth be completed?',
      },

      method: {
        type: Sequelize.ENUM('OTP_EMAIL', 'OTP_SMS', 'CODE', 'QR', 'MANUAL'),
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addIndex('auth_requirements', ['release_id', 'required_before'], { name: 'idx_auth_req_release_before' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('auth_requirements');
  },
};
