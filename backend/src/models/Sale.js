const { DataTypes } = require('sequelize');
const { PAYMENT_METHODS } = require('../constants/paymentMethods');

module.exports = (sequelize) => {
  return sequelize.define(
    'Sale',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      dish_id: { type: DataTypes.INTEGER, allowNull: true },
      seller_id: { type: DataTypes.INTEGER, allowNull: false },
      kilo_consumed: { type: DataTypes.DECIMAL(10, 4), allowNull: false, defaultValue: 0 },
      weight_type: {
        type: DataTypes.ENUM('quarter', 'half', 'kilo', 'slice'),
        allowNull: false,
      },
      slice_count: { type: DataTypes.INTEGER, allowNull: true },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      total_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      payment_method: {
        type: DataTypes.ENUM(...PAYMENT_METHODS),
        allowNull: false,
        defaultValue: 'cash',
      },
      sold_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'sales', underscored: true }
  );
};
