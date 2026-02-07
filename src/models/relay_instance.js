'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // your Sequelize instance

const RelayInstance = sequelize.define('RelayInstance', {
  relay_instance_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  relay_workflow_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'relay_instances',
  timestamps: false,
});

// Associations
RelayInstance.associate = models => {
  RelayInstance.belongsTo(models.RelayWorkflow, { foreignKey: 'relay_workflow_id' });
};

module.exports = RelayInstance;
