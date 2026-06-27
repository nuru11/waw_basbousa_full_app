'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pos_default_prices', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      price_quarter: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      price_half: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      price_kilo: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      price_per_slice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.bulkInsert('pos_default_prices', [
      {
        price_quarter: null,
        price_half: null,
        price_kilo: null,
        price_per_slice: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pos_default_prices');
  },
};
