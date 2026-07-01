'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TipPayment = sequelize.define(
    'TipPayment',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      seller_id: { type: DataTypes.INTEGER, allowNull: false },
      pay_period: { type: DataTypes.STRING(7), allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      expense_id: { type: DataTypes.INTEGER, allowNull: false },
      paid_at: { type: DataTypes.DATE, allowNull: false },
      paid_by: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'tip_payouts',
      underscored: true,
    }
  );

  return TipPayment;
};
