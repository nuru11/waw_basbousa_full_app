'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('water_settings', 'price_large_bottle', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.addColumn('sales', 'water_bottle_size', {
      type: Sequelize.ENUM('small', 'large'),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('sales', 'water_bottle_size');
    await queryInterface.removeColumn('water_settings', 'price_large_bottle');
  },
};
