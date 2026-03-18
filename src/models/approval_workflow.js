'use strict';
module.exports = (sequelize, DataTypes) => {
    const ApprovalWorkflow = sequelize.define('ApprovalWorkflow', {
        approval_workflow_id: { type: DataTypes.BIGINT, primaryKey: true },
        entity_type: { type: DataTypes.STRING(50), allowNull: false },
        entity_id: { type: DataTypes.BIGINT, allowNull: false },
        requested_by: { type: DataTypes.BIGINT, allowNull: false },
        approved_by: { type: DataTypes.BIGINT, allowNull: true },
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDING' },
        comments: { type: DataTypes.TEXT, allowNull: true },
        requested_at: { type: DataTypes.DATE, allowNull: false },
        approved_at: { type: DataTypes.DATE, allowNull: true },
    }, { tableName: 'approval_workflows', timestamps: false });

    ApprovalWorkflow.associate = (models) => {
        if (models.ApprovalStep) ApprovalWorkflow.hasMany(models.ApprovalStep, { foreignKey: 'approval_workflow_id' });
    };

    return ApprovalWorkflow;
};
