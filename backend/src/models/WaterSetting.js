const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'WaterSetting',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      price_per_bottle: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      price_large_bottle: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      current_stock_small_bottles: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },
      current_stock_large_bottles: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
      },
      min_stock_bottles: { type: DataTypes.DECIMAL(12, 3), allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'water_settings', underscored: true }
  );
};
