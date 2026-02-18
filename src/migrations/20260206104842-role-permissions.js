'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'role_permissions',
      {
        role_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'roles', key: 'role_id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },

        permission_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'permissions', key: 'permission_id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
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

    await queryInterface.addConstraint('role_permissions', {
      fields: ['role_id', 'permission_id'],
      type: 'primary key',
      name: 'pk_role_permissions',
    });

    await queryInterface.addIndex('role_permissions', ['permission_id'], {
      name: 'idx_role_permissions_permission',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('role_permissions');
  },
};
