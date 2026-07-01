const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Dish',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      plate_weight_grams: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      price_quarter: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      price_half: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      price_kilo: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      price_per_slice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      price_half_slice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'dishes', underscored: true }
  );
};
