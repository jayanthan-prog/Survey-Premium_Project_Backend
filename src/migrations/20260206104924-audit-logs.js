'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'audit_logs',
      {
        audit_log_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },

        actor_user_id: {
          type: Sequelize.CHAR(36),
          allowNull: true, // IMPORTANT for SET NULL
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        entity_type: {
          type: Sequelize.STRING(50), // USER | SURVEY | GROUP | ANSWER | AUTH
          allowNull: false,
        },

        entity_id: {
          type: Sequelize.CHAR(36),
          allowNull: true,
        },

        action: {
          type: Sequelize.STRING(50), // CREATE | UPDATE | DELETE | LOGIN | LOGOUT
          allowNull: false,
        },

        old_value: {
          type: Sequelize.JSON,
          allowNull: true,
        },

        new_value: {
          type: Sequelize.JSON,
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
      'audit_logs',
      ['entity_type', 'entity_id'],
      { name: 'idx_audit_entity' }
    );

    await queryInterface.addIndex(
      'audit_logs',
      ['actor_user_id'],
      { name: 'idx_audit_actor' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
  },
};
