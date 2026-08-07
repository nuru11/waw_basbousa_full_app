const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'SaleOrder',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      seller_id: { type: DataTypes.INTEGER, allowNull: false },
      tip_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      sold_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'sale_orders', underscored: true }
  );
};
