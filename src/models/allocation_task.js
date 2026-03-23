'use strict';

module.exports = (sequelize, DataTypes) => {
    const AllocationTask = sequelize.define(
        'AllocationTask',
        {
            allocation_task_id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            allocation_type: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: 'TASK',
            },
            status: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: 'ASSIGNED',
            },
            start_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            end_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            location: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            instructions: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            assigned_to: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },
            assigned_by: {
                type: DataTypes.BIGINT,
                allowNull: false,
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
            tableName: 'allocation_tasks',
            timestamps: false,
        }
    );

    AllocationTask.associate = (models) => {
        if (models.User) {
            AllocationTask.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'assignee' });
            AllocationTask.belongsTo(models.User, { foreignKey: 'assigned_by', as: 'assigner' });
        }
    };

    return AllocationTask;
};
