'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('purchases', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'received'),
      allowNull: false,
      defaultValue: 'pending',
    });
    await queryInterface.addColumn('purchases', 'approved_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'admins', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('purchases', 'approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('purchases', 'approved_at');
    await queryInterface.removeColumn('purchases', 'approved_by');
    await queryInterface.changeColumn('purchases', 'status', {
      type: Sequelize.ENUM('pending', 'received'),
      allowNull: false,
      defaultValue: 'pending',
    });
  },
};
