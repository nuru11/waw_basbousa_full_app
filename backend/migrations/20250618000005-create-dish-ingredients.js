'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dish_ingredients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      dish_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'dishes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ingredient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ingredients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity_per_plate: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
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

    await queryInterface.addIndex('dish_ingredients', ['dish_id', 'ingredient_id'], {
      unique: true,
      name: 'dish_ingredients_dish_ingredient_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('dish_ingredients');
  },
};
