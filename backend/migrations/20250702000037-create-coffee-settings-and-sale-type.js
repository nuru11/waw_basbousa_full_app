'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coffee_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ingredient_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'ingredients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      price_per_cup: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      cups_per_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 100,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.bulkInsert('coffee_settings', [
      {
        ingredient_id: null,
        price_per_cup: null,
        cups_per_kg: 100,
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.addColumn('sales', 'sale_type', {
      type: Sequelize.ENUM('plate', 'coffee'),
      allowNull: false,
      defaultValue: 'plate',
    });

    await queryInterface.sequelize.query(
      `ALTER TABLE sales MODIFY COLUMN weight_type ENUM('quarter', 'half', 'kilo', 'slice', 'half_slice') NULL`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE stock_movements MODIFY COLUMN type ENUM('purchase', 'production', 'adjustment', 'sale') NOT NULL`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE stock_movements MODIFY COLUMN type ENUM('purchase', 'production', 'adjustment') NOT NULL`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE sales MODIFY COLUMN weight_type ENUM('quarter', 'half', 'kilo', 'slice', 'half_slice') NOT NULL`
    );

    await queryInterface.removeColumn('sales', 'sale_type');
    await queryInterface.dropTable('coffee_settings');
  },
};
