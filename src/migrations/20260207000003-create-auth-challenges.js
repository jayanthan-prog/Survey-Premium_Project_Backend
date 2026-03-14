'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auth_challenges', {
      challenge_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      participation_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'survey_participation',
          key: 'participation_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      method: {
        type: Sequelize.ENUM('OTP_EMAIL', 'OTP_SMS', 'CODE', 'QR', 'MANUAL'),
        allowNull: false,
      },

      channel_target: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'email or phone number',
      },

      secret_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Hash of OTP/code - never store plain text',
      },

      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM('PENDING', 'VERIFIED', 'FAILED', 'EXPIRED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },

      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addIndex('auth_challenges', ['participation_id', 'status'], { name: 'idx_auth_challenges_participation' });
    await queryInterface.addIndex('auth_challenges', ['expires_at'], { name: 'idx_auth_challenges_expires' });
    await queryInterface.addIndex('auth_challenges', ['user_id'], { name: 'idx_auth_challenges_user' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('auth_challenges');
  },
};
