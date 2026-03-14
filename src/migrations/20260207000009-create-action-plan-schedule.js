'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('action_plan_schedule', {
      schedule_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      item_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'action_plan_items',
          key: 'item_id',
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

      start_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Scheduled start time',
      },

      end_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Scheduled end time',
      },

      status: {
        type: Sequelize.ENUM('PLANNED', 'LOCKED', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PLANNED',
        comment: 'PLANNED=editable, LOCKED=committed, COMPLETED=done, CANCELLED=cancelled',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    await queryInterface.addIndex('action_plan_schedule', ['user_id', 'start_at'], { name: 'idx_schedule_user_start' });
    await queryInterface.addIndex('action_plan_schedule', ['item_id', 'status'], { name: 'idx_schedule_item_status' });
    await queryInterface.addIndex('action_plan_schedule', ['user_id', 'status'], { name: 'idx_schedule_user_status' });

    // Prevent duplicate schedule for same item+user
    await queryInterface.addConstraint('action_plan_schedule', {
      fields: ['item_id', 'user_id'],
      type: 'unique',
      name: 'uq_schedule_item_user',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('action_plan_schedule');
  },
};
