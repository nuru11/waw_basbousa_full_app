const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'WaterStockMovement',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type: {
        type: DataTypes.ENUM('adjustment', 'sale'),
        allowNull: false,
      },
      quantity_delta: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
      bottle_size: {
        type: DataTypes.ENUM('small', 'large'),
        allowNull: true,
      },
      reference_id: { type: DataTypes.INTEGER, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: 'water_stock_movements', underscored: true, updatedAt: true }
  );
};
