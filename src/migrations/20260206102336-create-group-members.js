'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('group_members', {
      group_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'group_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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

      role_in_group: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    // Composite Primary Key
    await queryInterface.addConstraint('group_members', {
      fields: ['group_id', 'user_id'],
      type: 'primary key',
      name: 'pk_group_members',
    });

    // Index for faster user lookups
    await queryInterface.addIndex('group_members', ['user_id'], {
      name: 'idx_group_members_user',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('group_members');
  },
};
