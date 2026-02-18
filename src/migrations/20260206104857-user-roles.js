'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'user_roles',
      {
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

        role_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'roles',
            key: 'role_id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
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

    await queryInterface.addConstraint('user_roles', {
      fields: ['user_id', 'role_id'],
      type: 'primary key',
      name: 'pk_user_roles',
    });

    await queryInterface.addIndex('user_roles', ['role_id'], {
      name: 'idx_user_roles_role',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_roles');
  },
};
