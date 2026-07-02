const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'CoffeeSetting',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ingredient_id: { type: DataTypes.INTEGER, allowNull: true },
      price_per_cup: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      cups_per_kg: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 100 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'coffee_settings', underscored: true }
  );
};
