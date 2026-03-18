module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define(
    "UserRole",
    {
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      role_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "user_roles",
      timestamps: false,
    }
  );

  UserRole.associate = (models) => {
    UserRole.belongsTo(models.User, {
      foreignKey: "user_id",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    UserRole.belongsTo(models.Role, {
      foreignKey: "role_id",
      targetKey: "role_id",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return UserRole;
};
