const reportService = require('../services/reportService');

async function summary(req, res, next) {
  try {
    const data = await reportService.getSummary();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function purchases(req, res, next) {
  try {
    const data = await reportService.getPurchasesReport(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function sales(req, res, next) {
  try {
    const data = await reportService.getSalesReport(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function stockMovements(req, res, next) {
  try {
    const data = await reportService.getStockMovements(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function expenses(req, res, next) {
  try {
    const data = await reportService.getExpensesReport(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function dailySales(req, res, next) {
  try {
    const data = await reportService.getDailySalesOverview(req.query.date);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function monthly(req, res, next) {
  try {
    const data = await reportService.getMonthlyAnalysis(req.query.period);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, purchases, expenses, sales, stockMovements, dailySales, monthly };
