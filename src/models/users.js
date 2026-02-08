'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      user_id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: DataTypes.STRING,
      email: { type: DataTypes.STRING, unique: true, validate: { isEmail: true } },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'users',
      timestamps: false,
    }
  );

  // Optional associations can be defined here. Keep minimal to avoid circular issues.
  User.associate = (models) => {
    // A user may create many survey releases
    if (models.SurveyRelease) {
      User.hasMany(models.SurveyRelease, { foreignKey: 'created_by' });
    }
  };

  return User;
};
