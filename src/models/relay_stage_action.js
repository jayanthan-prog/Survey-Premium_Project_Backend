'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // your Sequelize instance

const RelayStageAction = sequelize.define('RelayStageAction', {
  relay_stage_action_id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4, // generates UUID automatically
  },

  relay_stage_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },

  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },

  action_type: {
    type: DataTypes.STRING(50), // e.g., NOTIFY, APPROVE, etc.
    allowNull: false,
  },

  config: {
    type: DataTypes.JSON,
    defaultValue: {},
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
  tableName: 'relay_stage_actions',
  timestamps: false,
});

// Associations
RelayStageAction.associate = (models) => {
  RelayStageAction.belongsTo(models.RelayStage, {
    foreignKey: 'relay_stage_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

module.exports = RelayStageAction;
