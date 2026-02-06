'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_permissions', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        defaultValue: Sequelize.literal('(UUID())'),
      },

      role_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: 'roles', key: 'role_id' },
        onDelete: 'CASCADE',
      },

      permission_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: 'permissions', key: 'permission_id' },
        onDelete: 'CASCADE',
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
    });

    await queryInterface.addConstraint('role_permissions', {
      fields: ['role_id', 'permission_id'],
      type: 'unique',
      name: 'uniq_role_permission',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('role_permissions');
  },
};
