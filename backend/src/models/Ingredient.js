const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Ingredient',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      unit: {
        type: DataTypes.ENUM('bottle', 'kg', 'piece', 'liter', 'gram'),
        allowNull: false,
        defaultValue: 'kg',
      },
      current_stock: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },
      min_stock: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: true,
        defaultValue: 0,
      },
      has_size: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    { tableName: 'ingredients', underscored: true }
  );
};
