const { Op } = require('sequelize');
const { Transfer, Admin } = require('../models');
const AppError = require('../utils/AppError');
const { getTodayRange } = require('../utils/dateUtils');

const TRANSFER_DATE_FIELDS = ['created_at', 'accepted_at'];

function getStartOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diffToMonday);
  return start;
}

async function listTransfers({ purchaserId, period, status, dateField } = {}) {
  const where = {};
  if (purchaserId) where.purchaser_id = purchaserId;
  if (status) where.status = status;

  if (period === 'week') {
    where.created_at = { [Op.gte]: getStartOfWeek() };
  } else if (period === 'history') {
    where.created_at = { [Op.lt]: getStartOfWeek() };
  } else if (period === 'today') {
    const field = TRANSFER_DATE_FIELDS.includes(dateField) ? dateField : 'created_at';
    const { start, end } = getTodayRange();
    where[field] = { [Op.between]: [start, end] };
  }

  return Transfer.findAll({
    where,
    include: [
      { model: Admin, as: 'purchaser', attributes: ['id', 'name', 'short_id'] },
      { model: Admin, as: 'creator', attributes: ['id', 'name', 'short_id'] },
    ],
    order: [['created_at', 'DESC']],
  });
}

async function createTransfer(createdBy, data) {
  const purchaser = await Admin.findByPk(data.purchaser_id);
  if (!purchaser || purchaser.role !== 'purchaser') {
    throw new AppError('Invalid purchaser', 400);
  }

  const amount = parseFloat(data.amount);
  if (!amount || amount <= 0) {
    throw new AppError('Amount must be positive', 400);
  }

  return Transfer.create({
    amount,
    amount_remaining: 0,
    status: 'pending',
    purchaser_id: data.purchaser_id,
    created_by: createdBy,
  }).then((transfer) =>
    Transfer.findByPk(transfer.id, {
      include: [
        { model: Admin, as: 'purchaser', attributes: ['id', 'name', 'short_id'] },
        { model: Admin, as: 'creator', attributes: ['id', 'name', 'short_id'] },
      ],
    })
  );
}

async function acceptTransfer(transferId, purchaserId) {
  const transfer = await Transfer.findByPk(transferId);
  if (!transfer) {
    throw new AppError('Transfer not found', 404);
  }
  if (transfer.purchaser_id !== purchaserId) {
    throw new AppError('Not authorized to accept this transfer', 403);
  }
  if (transfer.status !== 'pending') {
    throw new AppError('Transfer is not pending acceptance', 400);
  }

  await transfer.update({
    status: 'accepted',
    amount_remaining: transfer.amount,
    accepted_at: new Date(),
  });

  return Transfer.findByPk(transfer.id, {
    include: [
      { model: Admin, as: 'purchaser', attributes: ['id', 'name', 'short_id'] },
      { model: Admin, as: 'creator', attributes: ['id', 'name', 'short_id'] },
    ],
  });
}

async function getBalanceSummary(purchaserId) {
  const transfers = await Transfer.findAll({
    where: { purchaser_id: purchaserId },
  });

  let totalReceived = 0;
  let totalRemaining = 0;
  let totalPending = 0;

  for (const transfer of transfers) {
    const amount = parseFloat(transfer.amount);
    if (transfer.status === 'accepted') {
      totalReceived += amount;
      totalRemaining += parseFloat(transfer.amount_remaining);
    } else if (transfer.status === 'pending') {
      totalPending += amount;
    }
  }

  return {
    total_received: Math.round(totalReceived * 100) / 100,
    total_remaining: Math.round(totalRemaining * 100) / 100,
    total_pending: Math.round(totalPending * 100) / 100,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function getAdminSummary() {
  const transfers = await Transfer.findAll({
    include: [
      { model: Admin, as: 'purchaser', attributes: ['id', 'name', 'short_id'] },
    ],
  });

  let totalSent = 0;
  let totalPending = 0;
  let totalAccepted = 0;
  let totalRemaining = 0;
  const byPurchaserMap = new Map();

  for (const transfer of transfers) {
    const amount = parseFloat(transfer.amount);
    const remaining = parseFloat(transfer.amount_remaining);
    totalSent += amount;

    if (transfer.status === 'pending') {
      totalPending += amount;
    } else {
      totalAccepted += amount;
      totalRemaining += remaining;
    }

    const purchaserId = transfer.purchaser_id;
    if (!byPurchaserMap.has(purchaserId)) {
      byPurchaserMap.set(purchaserId, {
        purchaser_id: purchaserId,
        name: transfer.purchaser?.name || 'Unknown',
        transferred: 0,
        pending: 0,
        remaining: 0,
      });
    }
    const entry = byPurchaserMap.get(purchaserId);
    if (transfer.status === 'pending') {
      entry.pending += amount;
    } else {
      entry.transferred += amount;
      entry.remaining += remaining;
    }
  }

  const by_purchaser = Array.from(byPurchaserMap.values()).map((entry) => ({
    purchaser_id: entry.purchaser_id,
    name: entry.name,
    transferred: round2(entry.transferred),
    pending: round2(entry.pending),
    spent: round2(entry.transferred - entry.remaining),
    remaining: round2(entry.remaining),
  }));

  const total_spent = round2(totalAccepted - totalRemaining);

  return {
    total_sent: round2(totalSent),
    total_pending: round2(totalPending),
    total_transferred: round2(totalAccepted),
    total_spent,
    total_remaining: round2(totalRemaining),
    by_purchaser,
  };
}

async function deductFromTransfers(purchaserId, totalPrice, transaction) {
  const transfers = await Transfer.findAll({
    where: { purchaser_id: purchaserId, status: 'accepted' },
    order: [['created_at', 'ASC']],
    lock: transaction.LOCK.UPDATE,
    transaction,
  });

  if (transfers.length === 0) return;

  let remaining = parseFloat(totalPrice);

  for (const transfer of transfers) {
    if (remaining <= 0) break;

    const available = parseFloat(transfer.amount_remaining);
    if (available > 0) {
      const deduct = Math.min(available, remaining);
      await transfer.update(
        { amount_remaining: available - deduct },
        { transaction }
      );
      remaining -= deduct;
    }
  }

  if (remaining > 0) {
    const lastTransfer = transfers[transfers.length - 1];
    const current = parseFloat(lastTransfer.amount_remaining);
    await lastTransfer.update(
      { amount_remaining: current - remaining },
      { transaction }
    );
  }
}

module.exports = {
  listTransfers,
  createTransfer,
  acceptTransfer,
  getBalanceSummary,
  getAdminSummary,
  deductFromTransfers,
};
