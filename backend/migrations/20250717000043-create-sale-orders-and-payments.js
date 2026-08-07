'use strict';

const { PAYMENT_METHODS } = require('../src/constants/paymentMethods');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sale_orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      seller_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      tip_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      sold_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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

    const enumValues = PAYMENT_METHODS.map((m) => `'${m}'`).join(', ');
    await queryInterface.createTable('sale_order_payments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sale_order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sale_orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      payment_method: {
        type: Sequelize.ENUM(...PAYMENT_METHODS),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
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

    // Ensure ENUM matches PAYMENT_METHODS if Sequelize created a different set
    await queryInterface.sequelize.query(
      `ALTER TABLE sale_order_payments MODIFY COLUMN payment_method ENUM(${enumValues}) NOT NULL`
    );

    await queryInterface.addIndex('sale_order_payments', ['sale_order_id'], {
      name: 'sale_order_payments_sale_order_id',
    });

    await queryInterface.addColumn('sales', 'sale_order_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'sale_orders', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('sales', ['sale_order_id'], {
      name: 'sales_sale_order_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('sales', 'sales_sale_order_id');
    await queryInterface.removeColumn('sales', 'sale_order_id');
    await queryInterface.dropTable('sale_order_payments');
    await queryInterface.dropTable('sale_orders');
  },
};
