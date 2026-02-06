module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      user_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: DataTypes.TEXT,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      is_active: DataTypes.BOOLEAN,
      attributes: DataTypes.JSON,
    },
    {
      tableName: 'users',
      timestamps: false,
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Survey, { foreignKey: 'created_by' });
  };

  return User;
};
