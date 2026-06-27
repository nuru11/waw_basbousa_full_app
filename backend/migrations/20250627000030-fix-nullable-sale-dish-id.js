'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [constraints] = await queryInterface.sequelize.query(
      `SELECT CONSTRAINT_NAME
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'sales'
         AND COLUMN_NAME = 'dish_id'
         AND REFERENCED_TABLE_NAME IS NOT NULL`
    );

    for (const row of constraints) {
      await queryInterface.sequelize.query(
        `ALTER TABLE sales DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``
      );
    }

    await queryInterface.sequelize.query('ALTER TABLE sales MODIFY dish_id INT NULL');

    await queryInterface.sequelize.query(
      `ALTER TABLE sales
       ADD CONSTRAINT sales_dish_id_fkey
       FOREIGN KEY (dish_id) REFERENCES dishes(id)
       ON UPDATE CASCADE ON DELETE RESTRICT`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE sales DROP FOREIGN KEY sales_dish_id_fkey'
    );
    await queryInterface.sequelize.query('ALTER TABLE sales MODIFY dish_id INT NOT NULL');
    await queryInterface.sequelize.query(
      `ALTER TABLE sales
       ADD CONSTRAINT sales_dish_id_fkey
       FOREIGN KEY (dish_id) REFERENCES dishes(id)
       ON UPDATE CASCADE ON DELETE RESTRICT`
    );
  },
};
