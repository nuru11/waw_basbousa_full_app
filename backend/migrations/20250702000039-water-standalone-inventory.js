'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('water_settings', 'current_stock_bottles', {
      type: Sequelize.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('water_settings', 'min_stock_bottles', {
      type: Sequelize.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.sequelize.query(`
      UPDATE water_settings ws
      INNER JOIN ingredients i ON ws.ingredient_id = i.id
      SET ws.current_stock_bottles = i.current_stock
      WHERE ws.ingredient_id IS NOT NULL
    `);

    await queryInterface.removeColumn('water_settings', 'ingredient_id');
    await queryInterface.removeColumn('water_settings', 'bottles_per_liter');

    await queryInterface.createTable('water_stock_movements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: Sequelize.ENUM('adjustment', 'sale'),
        allowNull: false,
      },
      quantity_delta: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
      },
      reference_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('water_stock_movements');

    await queryInterface.addColumn('water_settings', 'bottles_per_liter', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 2,
    });

    await queryInterface.addColumn('water_settings', 'ingredient_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'ingredients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    await queryInterface.removeColumn('water_settings', 'min_stock_bottles');
    await queryInterface.removeColumn('water_settings', 'current_stock_bottles');
  },
};
