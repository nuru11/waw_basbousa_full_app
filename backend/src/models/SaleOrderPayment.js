const { DataTypes } = require('sequelize');
const { PAYMENT_METHODS } = require('../constants/paymentMethods');

module.exports = (sequelize) => {
  return sequelize.define(
    'SaleOrderPayment',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      sale_order_id: { type: DataTypes.INTEGER, allowNull: false },
      payment_method: {
        type: DataTypes.ENUM(...PAYMENT_METHODS),
        allowNull: false,
      },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    { tableName: 'sale_order_payments', underscored: true }
  );
};
