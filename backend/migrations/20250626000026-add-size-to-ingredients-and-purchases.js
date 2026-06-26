'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ingredients', 'has_size', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('purchases', 'size', {
      type: Sequelize.ENUM('small', 'large'),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('purchases', 'size');
    await queryInterface.removeColumn('ingredients', 'has_size');
  },
};
