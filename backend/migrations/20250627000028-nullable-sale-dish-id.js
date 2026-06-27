'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE sales MODIFY dish_id INT NULL');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE sales MODIFY dish_id INT NOT NULL');
  },
};
