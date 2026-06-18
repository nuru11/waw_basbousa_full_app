'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('purchases', 'invoice_number');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('purchases', 'invoice_number', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: '',
    });
  },
};
