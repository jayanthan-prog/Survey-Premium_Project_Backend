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
  RelayWorkflow.hasMany(models.RelayStageAction, { foreignKey: 'relay_workflow_id' });
};

module.exports = RelayWorkflow; 
