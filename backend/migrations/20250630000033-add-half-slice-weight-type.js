'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE sales MODIFY COLUMN weight_type ENUM('quarter', 'half', 'kilo', 'slice', 'half_slice') NOT NULL`
    );

    await queryInterface.addColumn('dishes', 'price_half_slice', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.addColumn('pos_default_prices', 'price_half_slice', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      `UPDATE pos_default_prices SET price_half_slice = 150 WHERE id = 1`
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('pos_default_prices', 'price_half_slice');
    await queryInterface.removeColumn('dishes', 'price_half_slice');

    await queryInterface.sequelize.query(
      `ALTER TABLE sales MODIFY COLUMN weight_type ENUM('quarter', 'half', 'kilo', 'slice') NOT NULL`
    );
  },
};
