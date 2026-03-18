'use strict';
module.exports = (sequelize, DataTypes) => {
    const ApprovalItem = sequelize.define('ApprovalItem', {
        approval_item_id: { type: DataTypes.BIGINT, primaryKey: true },
        approval_workflow_id: { type: DataTypes.BIGINT, allowNull: false },
        approval_step_id: { type: DataTypes.BIGINT, allowNull: true },
        entity_type: { type: DataTypes.STRING(50), allowNull: false },
        entity_id: { type: DataTypes.BIGINT, allowNull: false },
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDING' },
        decided_by: { type: DataTypes.BIGINT, allowNull: true },
        decided_at: { type: DataTypes.DATE, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false },
    }, { tableName: 'approval_items', timestamps: false });

    ApprovalItem.associate = (models) => {
        if (models.ApprovalStep) ApprovalItem.belongsTo(models.ApprovalStep, { foreignKey: 'approval_step_id' });
        if (models.ApprovalWorkflow) ApprovalItem.belongsTo(models.ApprovalWorkflow, { foreignKey: 'approval_workflow_id' });
        if (models.ApprovalAction) ApprovalItem.hasMany(models.ApprovalAction, { foreignKey: 'approval_item_id' });
    };

    return ApprovalItem;
};
