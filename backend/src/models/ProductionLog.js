const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'ProductionLog',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      dish_id: { type: DataTypes.INTEGER, allowNull: false },
      plates_count: { type: DataTypes.INTEGER, allowNull: false },
      chief_id: { type: DataTypes.INTEGER, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      logged_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'production_logs', underscored: true }
  );
};
