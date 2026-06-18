'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('ingredients', 'category_label');
    await queryInterface.removeColumn('ingredients', 'category');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('ingredients', 'category', {
      type: Sequelize.ENUM('oil', 'flour', 'sugar', 'meat', 'vegetables', 'spices', 'other'),
      allowNull: false,
      defaultValue: 'other',
    });
    await queryInterface.addColumn('ingredients', 'category_label', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },
};
