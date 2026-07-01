'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE expenses MODIFY COLUMN category ENUM('rental', 'salaries', 'electricity', 'other', 'tips') NOT NULL`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE expenses MODIFY COLUMN category ENUM('rental', 'salaries', 'electricity', 'other') NOT NULL`
    );
  },
};
