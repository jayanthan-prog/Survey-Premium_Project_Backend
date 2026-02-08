'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Sequelize instance

const RelayWorkflow = sequelize.define('RelayWorkflow', {
  relay_workflow_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'relay_workflows',
  timestamps: false,
});

// Associations (if you have related tables like relay_stages)
RelayWorkflow.associate = models => {
  RelayWorkflow.hasMany(models.RelayStage, { foreignKey: 'relay_workflow_id' });
  // RelayStageAction belongs to RelayStage (via relay_stage_id). Do not add a relay_workflow_id
  // association here because the `relay_stage_actions` table does not have a `relay_workflow_id` column
  // (the relation is through RelayStage -> RelayWorkflow). Adding the association wrongly injects
  // `relay_workflow_id` into the RelayStageAction model and causes SQL errors.
};

module.exports = RelayWorkflow; 
