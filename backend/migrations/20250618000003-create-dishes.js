'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dishes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      plate_weight_grams: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
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
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('dishes');
  },
};
