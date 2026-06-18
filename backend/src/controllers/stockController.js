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
      req.user.id
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
    const logs = await stockService.listProductionLogs();
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, adjust, logProduction, listProduction };
