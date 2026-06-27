'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'ChiefExpense',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      chief_id: { type: DataTypes.INTEGER, allowNull: false },
      category: {
        type: DataTypes.ENUM('food', 'hotel', 'other'),
        allowNull: false,
      },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      spent_at: { type: DataTypes.DATEONLY, allowNull: false },
      created_by: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'chief_expenses',
      underscored: true,
    }
  );
};
