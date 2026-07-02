'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('water_settings', 'current_stock_small_bottles', {
      type: Sequelize.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('water_settings', 'current_stock_large_bottles', {
      type: Sequelize.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.sequelize.query(`
      UPDATE water_settings
      SET current_stock_small_bottles = current_stock_bottles
      WHERE current_stock_bottles > 0
    `);

    await queryInterface.removeColumn('water_settings', 'current_stock_bottles');

    await queryInterface.addColumn('water_stock_movements', 'bottle_size', {
      type: Sequelize.ENUM('small', 'large'),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('water_stock_movements', 'bottle_size');

    await queryInterface.addColumn('water_settings', 'current_stock_bottles', {
      type: Sequelize.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.sequelize.query(`
      UPDATE water_settings
      SET current_stock_bottles = current_stock_small_bottles + current_stock_large_bottles
    `);

    await queryInterface.removeColumn('water_settings', 'current_stock_large_bottles');
    await queryInterface.removeColumn('water_settings', 'current_stock_small_bottles');
  },
};
