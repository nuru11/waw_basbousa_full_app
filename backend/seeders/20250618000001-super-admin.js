'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await queryInterface.bulkInsert('admins', [
      {
        name: 'Super Admin',
        username: 'superadmin',
        password_hash: passwordHash,
        phone: '0900000000',
        role: 'superAdmin',
        short_id: '1001',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('admins', { username: 'superadmin' });
  },
};
