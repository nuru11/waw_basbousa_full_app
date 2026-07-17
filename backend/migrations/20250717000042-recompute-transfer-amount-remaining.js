'use strict';

/**
 * Rebuild transfers.amount_remaining from purchases (FIFO).
 * Fixes corrupted per-transfer balances where later transfers were never
 * deducted while earlier ones were deeply negative.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();

    try {
      const [transfers] = await sequelize.query(
        `SELECT id, amount
         FROM transfers
         WHERE status = 'accepted'
         ORDER BY created_at ASC, id ASC`,
        { transaction }
      );

      const [purchases] = await sequelize.query(
        `SELECT total_price
         FROM purchases
         ORDER BY created_at ASC, id ASC`,
        { transaction }
      );

      const remainingById = new Map();
      for (const t of transfers) {
        remainingById.set(t.id, parseFloat(t.amount));
      }

      for (const purchase of purchases) {
        let toDeduct = parseFloat(purchase.total_price);
        if (!(toDeduct > 0)) continue;

        for (const t of transfers) {
          if (toDeduct <= 0) break;
          const available = remainingById.get(t.id);
          if (available > 0) {
            const deduct = Math.min(available, toDeduct);
            remainingById.set(t.id, available - deduct);
            toDeduct -= deduct;
          }
        }

        if (toDeduct > 0 && transfers.length > 0) {
          const last = transfers[transfers.length - 1];
          remainingById.set(last.id, remainingById.get(last.id) - toDeduct);
        }
      }

      for (const t of transfers) {
        const rem = Math.round(remainingById.get(t.id) * 100) / 100;
        await sequelize.query(
          `UPDATE transfers SET amount_remaining = :rem WHERE id = :id`,
          { replacements: { rem, id: t.id }, transaction }
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down() {
    // Irreversible data fix — previous corrupted values cannot be restored.
  },
};
