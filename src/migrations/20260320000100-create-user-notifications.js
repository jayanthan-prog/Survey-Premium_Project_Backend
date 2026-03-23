'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_notifications', {
            notification_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
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
            notification_type: {
                type: Sequelize.STRING(40),
                allowNull: false,
                defaultValue: 'GENERAL',
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            is_read: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            read_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            meta: {
                type: Sequelize.JSON,
                allowNull: true,
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

        await queryInterface.addIndex('user_notifications', ['user_id', 'is_read'], {
            name: 'idx_user_notifications_user_read',
        });

        await queryInterface.addIndex('user_notifications', ['created_at'], {
            name: 'idx_user_notifications_created_at',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('user_notifications');
    },
};
