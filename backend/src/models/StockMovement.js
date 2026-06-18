const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'StockMovement',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ingredient_id: { type: DataTypes.INTEGER, allowNull: false },
      type: {
        type: DataTypes.ENUM('purchase', 'production', 'adjustment'),
        allowNull: false,
      },
      quantity_delta: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
      reference_id: { type: DataTypes.INTEGER, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: 'stock_movements', underscored: true }
  );
};
