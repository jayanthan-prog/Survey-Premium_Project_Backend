'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('group_members', {
      group_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'groups',
          key: 'group_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addConstraint('group_members', {
      fields: ['group_id', 'user_id'],
      type: 'primary key',
      name: 'pk_group_members',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('group_members');
  },
};
