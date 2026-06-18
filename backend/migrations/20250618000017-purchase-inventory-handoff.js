'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('purchases', 'handed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.changeColumn('purchases', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'received', 'in_inventory', 'handed'),
      allowNull: false,
      defaultValue: 'in_inventory',
    });

    await queryInterface.sequelize.query(
      "UPDATE purchases SET status = 'in_inventory' WHERE status IN ('pending', 'approved')"
    );

    await queryInterface.changeColumn('purchases', 'status', {
      type: Sequelize.ENUM('in_inventory', 'handed', 'received'),
      allowNull: false,
      defaultValue: 'in_inventory',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('purchases', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'received', 'in_inventory', 'handed'),
      allowNull: false,
      defaultValue: 'pending',
    });

    await queryInterface.sequelize.query(
      "UPDATE purchases SET status = 'pending' WHERE status = 'in_inventory'"
    );
    await queryInterface.sequelize.query(
      "UPDATE purchases SET status = 'approved' WHERE status = 'handed'"
    );

    await queryInterface.changeColumn('purchases', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'received'),
      allowNull: false,
      defaultValue: 'pending',
    });

    await queryInterface.removeColumn('purchases', 'handed_at');
  },
};
