const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'PosDefaultPrice',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      price_quarter: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      price_half: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      price_kilo: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      price_per_slice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    },
    { tableName: 'pos_default_prices', underscored: true }
  );
};
