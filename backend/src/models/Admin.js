const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Admin = sequelize.define(
    'Admin',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      role: {
        type: DataTypes.ENUM('superAdmin', 'purchaser', 'chief', 'employee'),
        allowNull: false,
      },
      short_id: { type: DataTypes.STRING(4), allowNull: false, unique: true },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      monthly_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    },
    { tableName: 'admins', underscored: true }
  );

  Admin.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  };

  return Admin;
};
