'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('transfers', 'status', {
      type: Sequelize.ENUM('pending', 'accepted'),
      allowNull: false,
      defaultValue: 'pending',
    });
    await queryInterface.addColumn('transfers', 'accepted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      "UPDATE transfers SET status = 'accepted' WHERE status = 'pending'"
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('transfers', 'accepted_at');
    await queryInterface.removeColumn('transfers', 'status');
  },
};
