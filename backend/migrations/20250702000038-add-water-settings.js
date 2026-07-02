'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('water_settings', {
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
      price_per_bottle: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      bottles_per_liter: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 2,
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

    await queryInterface.bulkInsert('water_settings', [
      {
        ingredient_id: null,
        price_per_bottle: null,
        bottles_per_liter: 2,
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.sequelize.query(
      `ALTER TABLE sales MODIFY COLUMN sale_type ENUM('plate', 'coffee', 'water') NOT NULL DEFAULT 'plate'`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE sales MODIFY COLUMN sale_type ENUM('plate', 'coffee') NOT NULL DEFAULT 'plate'`
    );
    await queryInterface.dropTable('water_settings');
  },
};
