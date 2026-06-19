'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('production_logs', 'plate_weight_grams', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE production_logs pl
      INNER JOIN dishes d ON d.id = pl.dish_id
      SET pl.plate_weight_grams = d.plate_weight_grams
      WHERE pl.plate_weight_grams IS NULL AND d.plate_weight_grams IS NOT NULL
    `);

    await queryInterface.renameColumn('sales', 'employee_id', 'seller_id');

    await queryInterface.addColumn('sales', 'kilo_consumed', {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('sales', 'kilo_consumed');
    await queryInterface.renameColumn('sales', 'seller_id', 'employee_id');
    await queryInterface.removeColumn('production_logs', 'plate_weight_grams');
  },
};
