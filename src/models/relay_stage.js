'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // your Sequelize instance

const RelayStage = sequelize.define('RelayStage', {
  relay_stage_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  relay_workflow_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'relay_stages',
  timestamps: false,
});

// Associations
RelayStage.associate = models => {
  RelayStage.belongsTo(models.RelayWorkflow, { foreignKey: 'relay_workflow_id' });
  RelayStage.hasMany(models.RelayStageAction, { foreignKey: 'relay_stage_id' });
};

module.exports = RelayStage;
