const chiefExpenseService = require('../services/chiefExpenseService');

async function list(req, res, next) {
  try {
    const chiefId =
      req.user.role === 'chief'
        ? req.user.id
        : req.query.chief_id
          ? parseInt(req.query.chief_id, 10)
          : undefined;

    const data = await chiefExpenseService.listChiefExpenses({
      period: req.query.period || undefined,
      category: req.query.category || undefined,
      chiefId,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    const data = await chiefExpenseService.getSummary({
      period: req.query.period || 'month',
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { chief_id, category, amount, description, spent_at } = req.body;
    const expense = await chiefExpenseService.createChiefExpense(req.user.id, {
      chief_id,
      category,
      amount,
      description,
      spent_at,
    });
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const data = await chiefExpenseService.deleteChiefExpense(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, summary, create, remove };
