const { Op, fn, col } = require('sequelize');
const { sequelize, Admin, Sale, TipPayment, Expense } = require('../models');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { getMonthRange, formatPayPeriodLabel, formatDateYmd } = require('../utils/dateUtils');

async function getSellerOrThrow(sellerId, transaction) {
  const seller = await Admin.findByPk(sellerId, { transaction });
  if (!seller || seller.status !== 'active') {
    throw new AppError('SELLER_NOT_FOUND', ERROR_CODES.SELLER_NOT_FOUND, 404);
  }
  if (!['employee', 'chief'].includes(seller.role)) {
    throw new AppError('SELLER_INVALID_ROLE', ERROR_CODES.SELLER_INVALID_ROLE, 422);
  }
  return seller;
}

async function sumTipsForSellerInPeriod(sellerId, start, end, transaction) {
  const result = await Sale.sum('tip_amount', {
    where: {
      seller_id: sellerId,
      sold_at: { [Op.between]: [start, end] },
      tip_amount: { [Op.gt]: 0 },
    },
    transaction,
  });
  return parseFloat(result || 0);
}

async function listPayouts({ period } = {}) {
  const { start, end, period: payPeriod } = getMonthRange(period);

  const tipRows = await Sale.findAll({
    attributes: ['seller_id', [fn('SUM', col('tip_amount')), 'tips_earned']],
    where: {
      sold_at: { [Op.between]: [start, end] },
      tip_amount: { [Op.gt]: 0 },
    },
    group: ['seller_id'],
    raw: true,
  });

  if (tipRows.length === 0) {
    return {
      period: payPeriod,
      summary: {
        total_tips: 0,
        paid_count: 0,
        pending_count: 0,
        paid_amount: 0,
      },
      sellers: [],
    };
  }

  const sellerIds = tipRows.map((row) => row.seller_id);
  const [sellers, payments] = await Promise.all([
    Admin.findAll({
      where: { id: { [Op.in]: sellerIds } },
      attributes: ['id', 'name', 'short_id', 'role', 'status'],
      order: [['name', 'ASC']],
    }),
    TipPayment.findAll({
      where: { pay_period: payPeriod, seller_id: { [Op.in]: sellerIds } },
      attributes: ['id', 'seller_id', 'amount', 'paid_at', 'expense_id'],
    }),
  ]);

  const tipsBySeller = new Map(
    tipRows.map((row) => [row.seller_id, parseFloat(row.tips_earned || 0)])
  );
  const paymentBySeller = new Map(payments.map((p) => [p.seller_id, p]));

  let totalTips = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let paidAmount = 0;

  const rows = sellers.map((seller) => {
    const tipsEarned = tipsBySeller.get(seller.id) || 0;
    const payment = paymentBySeller.get(seller.id);

    totalTips += tipsEarned;
    if (payment) {
      paidCount += 1;
      paidAmount += parseFloat(payment.amount);
    } else if (tipsEarned > 0) {
      pendingCount += 1;
    }

    return {
      seller_id: seller.id,
      name: seller.name,
      short_id: seller.short_id,
      role: seller.role,
      tips_earned: tipsEarned,
      payment: payment
        ? {
            paid_at: payment.paid_at,
            amount: parseFloat(payment.amount),
            expense_id: payment.expense_id,
          }
        : null,
    };
  });

  return {
    period: payPeriod,
    summary: {
      total_tips: totalTips,
      paid_count: paidCount,
      pending_count: pendingCount,
      paid_amount: paidAmount,
    },
    sellers: rows,
  };
}

async function markPaid(sellerId, period, paidBy) {
  const { start, end, period: payPeriod } = getMonthRange(period);
  const transaction = await sequelize.transaction();

  try {
    const seller = await getSellerOrThrow(sellerId, transaction);
    const tipsEarned = await sumTipsForSellerInPeriod(sellerId, start, end, transaction);

    if (!tipsEarned || tipsEarned <= 0) {
      throw new AppError('NO_TIPS_TO_PAY', ERROR_CODES.NO_TIPS_TO_PAY, 400);
    }

    const existing = await TipPayment.findOne({
      where: { seller_id: sellerId, pay_period: payPeriod },
      transaction,
    });
    if (existing) {
      throw new AppError('TIP_ALREADY_PAID', ERROR_CODES.TIP_ALREADY_PAID, 400);
    }

    const today = formatDateYmd(new Date());
    const description = `Tips — ${seller.name} — ${formatPayPeriodLabel(payPeriod)}`;

    const expense = await Expense.create(
      {
        category: 'tips',
        amount: tipsEarned,
        description,
        spent_at: today,
        created_by: paidBy,
      },
      { transaction }
    );

    const payment = await TipPayment.create(
      {
        seller_id: sellerId,
        pay_period: payPeriod,
        amount: tipsEarned,
        expense_id: expense.id,
        paid_at: new Date(),
        paid_by: paidBy,
      },
      { transaction }
    );

    await transaction.commit();

    return {
      seller_id: seller.id,
      period: payPeriod,
      payment: {
        paid_at: payment.paid_at,
        amount: tipsEarned,
        expense_id: expense.id,
      },
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  listPayouts,
  markPaid,
};
