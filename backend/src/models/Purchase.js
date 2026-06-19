const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Purchase',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ingredient_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
      unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      total_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      purchaser_id: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'in_inventory', 'handed', 'received'),
        allowNull: false,
        defaultValue: 'pending',
      },
      approved_by: { type: DataTypes.INTEGER, allowNull: true },
      approved_at: { type: DataTypes.DATE, allowNull: true },
      screenshot_path: { type: DataTypes.STRING(255), allowNull: true },
      chief_id: { type: DataTypes.INTEGER, allowNull: true },
      handed_at: { type: DataTypes.DATE, allowNull: true },
      received_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'purchases', underscored: true }
  );
};
