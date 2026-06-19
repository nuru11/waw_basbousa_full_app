'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('purchases', 'status', {
      type: Sequelize.ENUM('pending', 'in_inventory', 'handed', 'received'),
      allowNull: false,
      defaultValue: 'pending',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "UPDATE purchases SET status = 'in_inventory' WHERE status = 'pending'"
    );

    await queryInterface.changeColumn('purchases', 'status', {
      type: Sequelize.ENUM('in_inventory', 'handed', 'received'),
      allowNull: false,
      defaultValue: 'in_inventory',
    });
  },
};
