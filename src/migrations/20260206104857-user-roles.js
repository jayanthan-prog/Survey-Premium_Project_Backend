'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'user_roles',
      {
        user_role_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },

        user_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          references: {
            model: 'users',
            key: 'user_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        role: {
          type: Sequelize.STRING(50), // ADMIN | CREATOR | PARTICIPANT | REVIEWER
          allowNull: false,
        },

        assigned_at: {
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
      'user_roles',
      ['user_id', 'role'],
      {
        unique: true,
        name: 'uniq_user_role',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_roles');
  },
};
