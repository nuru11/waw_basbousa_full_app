const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'DishIngredient',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      dish_id: { type: DataTypes.INTEGER, allowNull: false },
      ingredient_id: { type: DataTypes.INTEGER, allowNull: false },
      size: {
        type: DataTypes.ENUM('small', 'large'),
        allowNull: true,
      },
      quantity_per_plate: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
    },
    { tableName: 'dish_ingredients', underscored: true }
  );
};
