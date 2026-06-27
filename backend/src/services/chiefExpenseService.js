const { Op, fn, col } = require('sequelize');
const { ChiefExpense, Admin } = require('../models');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { isValidChiefExpenseCategory } = require('../constants/chiefExpenseCategories');
const {
  getTodayRange,
  getYesterdayRange,
  getStartOfWeek,
  getStartOfMonth,
  getStartOfQuarter,
  formatDateYmd,
} = require('../utils/dateUtils');

const chiefExpenseIncludes = [
  { model: Admin, as: 'chief', attributes: ['id', 'name', 'short_id'] },
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

async function listChiefExpenses({ period, category, chiefId } = {}) {
  const where = { ...buildPeriodWhere(period) };

  if (chiefId) {
    where.chief_id = chiefId;
  }

  if (category && category !== 'all') {
    if (!isValidChiefExpenseCategory(category)) {
      throw new AppError(
        'VALIDATION_INVALID_CHIEF_EXPENSE_CATEGORY',
        ERROR_CODES.VALIDATION_INVALID_CHIEF_EXPENSE_CATEGORY,
        400
      );
    }
    where.category = category;
  }

  return ChiefExpense.findAll({
    where,
    include: chiefExpenseIncludes,
    order: [['spent_at', 'DESC'], ['created_at', 'DESC']],
  });
}

async function createChiefExpense(createdBy, data) {
  if (!isValidChiefExpenseCategory(data.category)) {
    throw new AppError(
      'VALIDATION_INVALID_CHIEF_EXPENSE_CATEGORY',
      ERROR_CODES.VALIDATION_INVALID_CHIEF_EXPENSE_CATEGORY,
      400
    );
  }

  const chief = await Admin.findByPk(data.chief_id);
  if (!chief || chief.role !== 'chief' || chief.status !== 'active') {
    throw new AppError('INVALID_CHIEF', ERROR_CODES.INVALID_CHIEF, 400);
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

  const expense = await ChiefExpense.create({
    chief_id: data.chief_id,
    category: data.category,
    amount,
    description,
    spent_at: data.spent_at,
    created_by: createdBy,
  });

  return ChiefExpense.findByPk(expense.id, { include: chiefExpenseIncludes });
}

async function deleteChiefExpense(expenseId) {
  const expense = await ChiefExpense.findByPk(expenseId);
  if (!expense) {
    throw new AppError('CHIEF_EXPENSE_NOT_FOUND', ERROR_CODES.CHIEF_EXPENSE_NOT_FOUND, 404);
  }
  await expense.destroy();
  return { id: expenseId };
}

async function getSummary({ period = 'month' } = {}) {
  const where = buildPeriodWhere(period);

  const [totalResult, byCategoryRows, count] = await Promise.all([
    ChiefExpense.sum('amount', { where }),
    ChiefExpense.findAll({
      attributes: ['category', [fn('SUM', col('amount')), 'total']],
      where,
      group: ['category'],
      raw: true,
    }),
    ChiefExpense.count({ where }),
  ]);

  const by_category = {
    food: 0,
    hotel: 0,
    other: 0,
  };

  for (const row of byCategoryRows) {
    by_category[row.category] = parseFloat(row.total || 0);
  }

  return {
    total: parseFloat(totalResult || 0),
    count,
    by_category,
  };
}

module.exports = {
  listChiefExpenses,
  createChiefExpense,
  deleteChiefExpense,
  getSummary,
  buildPeriodWhere,
};
