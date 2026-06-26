'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE purchases SET status = 'in_inventory' WHERE status = 'pending'"
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE purchases SET status = 'pending' WHERE status = 'in_inventory' AND approved_by IS NULL AND approved_at IS NULL"
    );
  },
};
