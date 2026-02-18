'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'audit_logs',
      {
        audit_log_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
        },

        actor_user_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },

        entity_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },

        entity_id: {
          type: Sequelize.UUID,
          allowNull: true,
        },

        action: {
          type: Sequelize.STRING(50),
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
      ['entity_type', 'entity_id', 'created_at'],
      { name: 'idx_audit_entity_time' }
    );

    await queryInterface.addIndex(
      'audit_logs',
      ['actor_user_id'],
      { name: 'idx_audit_actor' }
    );

    await queryInterface.addIndex(
      'audit_logs',
      ['created_at'],
      { name: 'idx_audit_created_at' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
  },
};
