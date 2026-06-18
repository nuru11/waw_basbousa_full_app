'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('transfers', 'category_label');
    await queryInterface.removeColumn('transfers', 'category');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('transfers', 'category', {
      type: Sequelize.ENUM('oil', 'flour', 'sugar', 'meat', 'vegetables', 'spices', 'other'),
      allowNull: false,
      defaultValue: 'other',
    });
    await queryInterface.addColumn('transfers', 'category_label', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },
};
