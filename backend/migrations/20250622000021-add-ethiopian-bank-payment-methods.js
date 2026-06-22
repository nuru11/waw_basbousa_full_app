'use strict';

const { PAYMENT_METHODS } = require('../src/constants/paymentMethods');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const enumValues = PAYMENT_METHODS.map((m) => `'${m}'`).join(', ');
    await queryInterface.sequelize.query(
      `ALTER TABLE sales MODIFY COLUMN payment_method ENUM(${enumValues}) NOT NULL DEFAULT 'cash'`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE sales MODIFY COLUMN payment_method ENUM('cash', 'cbe', 'telebirr', 'other') NOT NULL DEFAULT 'cash'`
    );
  },
};
