'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'auth_tokens',
      {
        auth_token_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
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

        token_hash: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
        },

        token_type: {
          type: Sequelize.STRING(30), // ACCESS | REFRESH | API
          allowNull: false,
        },

        expires_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },

        revoked_at: {
          type: Sequelize.DATE,
          allowNull: true,
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
      'auth_tokens',
      ['user_id', 'token_type'],
      { name: 'idx_auth_tokens_user_type' }
    );

    await queryInterface.addIndex(
      'auth_tokens',
      ['expires_at'],
      { name: 'idx_auth_tokens_expiration' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('auth_tokens');
  },
};
