'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define(
    'Expense',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      category: {
        type: DataTypes.ENUM('rental', 'salaries', 'electricity', 'other', 'tips'),
        allowNull: false,
      },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      spent_at: { type: DataTypes.DATEONLY, allowNull: false },
      receipt_path: { type: DataTypes.STRING(255), allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'expenses',
      underscored: true,
    }
  );

  return Expense;
};
