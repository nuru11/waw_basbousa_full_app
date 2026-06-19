const saleService = require('../services/saleService');

async function create(req, res, next) {
  try {
    const sale = await saleService.createSale(req.user.id, req.body);
    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const sales = await saleService.listSales();
    res.json({ success: true, data: sales });
  } catch (err) {
    next(err);
  }
}

async function mine(req, res, next) {
  try {
    const sales = await saleService.getMySales(req.user.id);
    res.json({ success: true, data: sales });
  } catch (err) {
    next(err);
  }
}

async function sellers(req, res, next) {
  try {
    const sellers = await saleService.listSellers();
    res.json({ success: true, data: sellers });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, mine, sellers };
