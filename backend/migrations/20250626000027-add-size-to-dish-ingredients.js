'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('dish_ingredients');

    if (!table.size) {
      await queryInterface.addColumn('dish_ingredients', 'size', {
        type: Sequelize.ENUM('small', 'large'),
        allowNull: true,
      });
    }

    const indexes = await queryInterface.showIndex('dish_ingredients');
    const indexNames = indexes.map((idx) => idx.name);

    if (!indexNames.includes('dish_ingredients_dish_id_idx')) {
      await queryInterface.addIndex('dish_ingredients', ['dish_id'], {
        name: 'dish_ingredients_dish_id_idx',
      });
    }

    if (!indexNames.includes('dish_ingredients_dish_ingredient_size_unique')) {
      await queryInterface.addIndex('dish_ingredients', ['dish_id', 'ingredient_id', 'size'], {
        unique: true,
        name: 'dish_ingredients_dish_ingredient_size_unique',
      });
    }

    if (indexNames.includes('dish_ingredients_dish_ingredient_unique')) {
      await queryInterface.removeIndex(
        'dish_ingredients',
        'dish_ingredients_dish_ingredient_unique'
      );
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('dish_ingredients');
    const indexNames = indexes.map((idx) => idx.name);

    if (!indexNames.includes('dish_ingredients_dish_ingredient_unique')) {
      await queryInterface.addIndex('dish_ingredients', ['dish_id', 'ingredient_id'], {
        unique: true,
        name: 'dish_ingredients_dish_ingredient_unique',
      });
    }

    if (indexNames.includes('dish_ingredients_dish_ingredient_size_unique')) {
      await queryInterface.removeIndex(
        'dish_ingredients',
        'dish_ingredients_dish_ingredient_size_unique'
      );
    }

    if (indexNames.includes('dish_ingredients_dish_id_idx')) {
      await queryInterface.removeIndex('dish_ingredients', 'dish_ingredients_dish_id_idx');
    }

    const table = await queryInterface.describeTable('dish_ingredients');
    if (table.size) {
      await queryInterface.removeColumn('dish_ingredients', 'size');
    }
  },
};
