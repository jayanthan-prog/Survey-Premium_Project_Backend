'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('allocation_tasks', {
            allocation_task_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            allocation_type: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: 'TASK',
            },
            status: {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: 'ASSIGNED',
            },
            start_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            end_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            location: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            instructions: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            assigned_to: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            assigned_by: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
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
        });

        await queryInterface.addIndex('allocation_tasks', ['assigned_to'], { name: 'idx_allocation_tasks_assigned_to' });
        await queryInterface.addIndex('allocation_tasks', ['assigned_by'], { name: 'idx_allocation_tasks_assigned_by' });
        await queryInterface.addIndex('allocation_tasks', ['status'], { name: 'idx_allocation_tasks_status' });
        await queryInterface.addIndex('allocation_tasks', ['start_at', 'end_at'], { name: 'idx_allocation_tasks_window' });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('allocation_tasks');
    },
};
