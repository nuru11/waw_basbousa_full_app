const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Transfer',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      amount_remaining: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      purchaser_id: { type: DataTypes.INTEGER, allowNull: false },
      created_by: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'accepted'),
        allowNull: false,
        defaultValue: 'pending',
      },
      accepted_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'transfers', underscored: true }
  );
};
