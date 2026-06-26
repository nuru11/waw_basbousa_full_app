const { Op, fn, col } = require('sequelize');
const { Expense, Admin } = require('../models');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { isValidExpenseCategory } = require('../constants/expenseCategories');
const {
  getTodayRange,
  getYesterdayRange,
  getStartOfWeek,
  getStartOfMonth,
  getStartOfQuarter,
  formatDateYmd,
} = require('../utils/dateUtils');

const expenseIncludes = [
  { model: Admin, as: 'creator', attributes: ['id', 'name', 'short_id'] },
];

function buildPeriodWhere(period, dateField = 'spent_at') {
  if (!period || period === 'all') return {};

  const where = {};
  if (period === 'today') {
    const { start, end } = getTodayRange();
    where[dateField] = { [Op.between]: [formatDateYmd(start), formatDateYmd(end)] };
  } else if (period === 'yesterday') {
    const { start, end } = getYesterdayRange();
    where[dateField] = { [Op.between]: [formatDateYmd(start), formatDateYmd(end)] };
  } else if (period === 'week') {
    where[dateField] = { [Op.gte]: formatDateYmd(getStartOfWeek()) };
  } else if (period === 'month') {
    where[dateField] = { [Op.gte]: formatDateYmd(getStartOfMonth()) };
  } else if (period === 'quarter') {
    where[dateField] = { [Op.gte]: formatDateYmd(getStartOfQuarter()) };
  }

  return where;
}

async function listExpenses({ period, category } = {}) {
  const where = { ...buildPeriodWhere(period) };
  if (category && category !== 'all') {
    if (!isValidExpenseCategory(category)) {
      throw new AppError('VALIDATION_INVALID_EXPENSE_CATEGORY', ERROR_CODES.VALIDATION_INVALID_EXPENSE_CATEGORY, 400);
    }
    where.category = category;
  }

  return Expense.findAll({
    where,
    include: expenseIncludes,
    order: [['spent_at', 'DESC'], ['created_at', 'DESC']],
  });
}

async function createExpense(createdBy, data) {
  if (!isValidExpenseCategory(data.category)) {
    throw new AppError('VALIDATION_INVALID_EXPENSE_CATEGORY', ERROR_CODES.VALIDATION_INVALID_EXPENSE_CATEGORY, 400);
  }

  const amount = parseFloat(data.amount);
  if (!amount || amount <= 0) {
    throw new AppError('VALIDATION_AMOUNT_POSITIVE', ERROR_CODES.VALIDATION_AMOUNT_POSITIVE, 400);
  }

  const description = data.description?.trim() || null;
  if (data.category === 'other' && !description) {
    throw new AppError('VALIDATION_DESCRIPTION_REQUIRED', ERROR_CODES.VALIDATION_DESCRIPTION_REQUIRED, 400);
  }

  if (!data.spent_at) {
    throw new AppError('VALIDATION_SPENT_AT_REQUIRED', ERROR_CODES.VALIDATION_SPENT_AT_REQUIRED, 400);
  }

  return Expense.create({
    category: data.category,
    amount,
    description,
    spent_at: data.spent_at,
    receipt_path: data.receipt_path || null,
    created_by: createdBy,
  });
}

async function deleteExpense(expenseId) {
  const expense = await Expense.findByPk(expenseId);
  if (!expense) {
    throw new AppError('EXPENSE_NOT_FOUND', ERROR_CODES.EXPENSE_NOT_FOUND, 404);
  }
  await expense.destroy();
  return { id: expenseId };
}

async function getExpenseForReceipt(expenseId) {
  const expense = await Expense.findByPk(expenseId);
  if (!expense || !expense.receipt_path) {
    throw new AppError('RECEIPT_NOT_FOUND', ERROR_CODES.RECEIPT_NOT_FOUND, 404);
  }
  return expense;
}

async function getSummary({ period = 'month' } = {}) {
  const where = buildPeriodWhere(period);

  const [totalResult, byCategoryRows] = await Promise.all([
    Expense.sum('amount', { where }),
    Expense.findAll({
      attributes: ['category', [fn('SUM', col('amount')), 'total']],
      where,
      group: ['category'],
      raw: true,
    }),
  ]);

  const by_category = {
    rental: 0,
    salaries: 0,
    electricity: 0,
    other: 0,
  };

  for (const row of byCategoryRows) {
    by_category[row.category] = parseFloat(row.total || 0);
  }

  return {
    total: parseFloat(totalResult || 0),
    by_category,
  };
}

module.exports = {
  listExpenses,
  createExpense,
  deleteExpense,
  getExpenseForReceipt,
  getSummary,
};
