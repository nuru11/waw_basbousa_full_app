const stockService = require('../services/stockService');

async function list(req, res, next) {
  try {
    const stock = await stockService.listStock();
    res.json({ success: true, data: stock });
  } catch (err) {
    next(err);
  }
}

async function adjust(req, res, next) {
  try {
    const result = await stockService.adjustStock(
      req.body.ingredient_id,
      req.body,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function logProduction(req, res, next) {
  try {
    const log = await stockService.logProduction(req.user.id, req.body);
    res.status(201).json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}

async function listProduction(req, res, next) {
  try {
    const logs = await stockService.listProductionLogs({
      period: req.query.period === 'today' ? 'today' : undefined,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}

async function plateAvailabilityToday(req, res, next) {
  try {
    const dishId = parseInt(req.query.dish_id, 10);
    if (!dishId) {
      return res.status(400).json({ success: false, message: 'dish_id is required' });
    }
    const data = await stockService.getTodayPlateAvailability(dishId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function plateAvailabilityTodayTotal(req, res, next) {
  try {
    const data = await stockService.getTodayTotalPlatePool();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listTodayPlates(req, res, next) {
  try {
    const data = await stockService.listTodayPlatesOverview(req.query.date);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listPlatesHistory(req, res, next) {
  try {
    const data = await stockService.listAllPlatesOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  adjust,
  logProduction,
  listProduction,
  plateAvailabilityToday,
  plateAvailabilityTodayTotal,
  listTodayPlates,
  listPlatesHistory,
};
