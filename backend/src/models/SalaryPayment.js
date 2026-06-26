'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SalaryPayment = sequelize.define(
    'SalaryPayment',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      employee_id: { type: DataTypes.INTEGER, allowNull: false },
      pay_period: { type: DataTypes.STRING(7), allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      expense_id: { type: DataTypes.INTEGER, allowNull: false },
      paid_at: { type: DataTypes.DATE, allowNull: false },
      paid_by: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'salary_payments',
      underscored: true,
    }
  );

  return SalaryPayment;
};
