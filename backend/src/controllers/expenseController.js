const path = require('path');
const expenseService = require('../services/expenseService');
const { EXPENSE_RECEIPT_DIR } = require('../middleware/upload');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

async function list(req, res, next) {
  try {
    const data = await expenseService.listExpenses({
      period: req.query.period || undefined,
      category: req.query.category || undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    const data = await expenseService.getSummary({
      period: req.query.period || 'month',
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { category, amount, description, spent_at } = req.body;

    if (!category) {
      throw new AppError('VALIDATION_INVALID_EXPENSE_CATEGORY', ERROR_CODES.VALIDATION_INVALID_EXPENSE_CATEGORY, 400);
    }

    const expense = await expenseService.createExpense(req.user.id, {
      category,
      amount,
      description,
      spent_at,
      receipt_path: req.file?.filename || null,
    });
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const data = await expenseService.deleteExpense(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function receipt(req, res, next) {
  try {
    const expense = await expenseService.getExpenseForReceipt(req.params.id);
    const filePath = path.join(EXPENSE_RECEIPT_DIR, expense.receipt_path);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, summary, create, remove, receipt };
