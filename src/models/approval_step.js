'use strict';
module.exports = (sequelize, DataTypes) => {
    const ApprovalStep = sequelize.define('ApprovalStep', {
        approval_step_id: { type: DataTypes.BIGINT, primaryKey: true },
        approval_workflow_id: { type: DataTypes.BIGINT, allowNull: false },
        step_order: { type: DataTypes.INTEGER, allowNull: false },
        approver_user_id: { type: DataTypes.BIGINT, allowNull: true },
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDING' },
        acted_at: { type: DataTypes.DATE, allowNull: true },
        comments: { type: DataTypes.TEXT, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false },
    }, { tableName: 'approval_steps', timestamps: false });

    ApprovalStep.associate = (models) => {
        if (models.ApprovalWorkflow) ApprovalStep.belongsTo(models.ApprovalWorkflow, { foreignKey: 'approval_workflow_id' });
        if (models.ApprovalItem) ApprovalStep.hasMany(models.ApprovalItem, { foreignKey: 'approval_step_id' });
    };

    return ApprovalStep;
};
