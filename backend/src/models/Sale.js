const { DataTypes } = require('sequelize');
const { PAYMENT_METHODS } = require('../constants/paymentMethods');

module.exports = (sequelize) => {
  return sequelize.define(
    'Sale',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      dish_id: { type: DataTypes.INTEGER, allowNull: true },
      sale_type: {
        type: DataTypes.ENUM('plate', 'coffee', 'water'),
        allowNull: false,
        defaultValue: 'plate',
      },
      seller_id: { type: DataTypes.INTEGER, allowNull: false },
      kilo_consumed: { type: DataTypes.DECIMAL(10, 4), allowNull: false, defaultValue: 0 },
      weight_type: {
        type: DataTypes.ENUM('quarter', 'half', 'kilo', 'slice', 'half_slice'),
        allowNull: true,
      },
      slice_count: { type: DataTypes.INTEGER, allowNull: true },
      water_bottle_size: {
        type: DataTypes.ENUM('small', 'large'),
        allowNull: true,
      },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      total_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      payment_method: {
        type: DataTypes.ENUM(...PAYMENT_METHODS),
        allowNull: false,
        defaultValue: 'cash',
      },
      tip_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      sold_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'sales', underscored: true }
  );
};
