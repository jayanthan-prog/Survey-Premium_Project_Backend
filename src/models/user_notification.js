'use strict';

module.exports = (sequelize, DataTypes) => {
    const UserNotification = sequelize.define(
        'UserNotification',
        {
            notification_id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
            },
            user_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },
            notification_type: {
                type: DataTypes.STRING(40),
                allowNull: false,
                defaultValue: 'GENERAL',
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            is_read: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            read_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            meta: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'user_notifications',
            timestamps: false,
        }
    );

    UserNotification.associate = (models) => {
        if (models.User) {
            UserNotification.belongsTo(models.User, { foreignKey: 'user_id' });
        }
    };

    return UserNotification;
};
