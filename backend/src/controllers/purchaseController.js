const path = require('path');
const purchaseService = require('../services/purchaseService');
const { UPLOAD_DIR } = require('../middleware/upload');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { redactPurchase, redactPurchases } = require('../utils/financialRedaction');

async function list(req, res, next) {
  try {
    const { status } = req.query;
    const purchaserId =
      req.user.role === 'purchaser' ? req.user.id : req.query.purchaser_id;

    const purchases = await purchaseService.listPurchases({
      purchaserId: purchaserId || undefined,
      status: status || undefined,
      period: req.query.period || undefined,
      dateField: req.query.date_field || undefined,
    });
    const data =
      req.user.role === 'chief' ? redactPurchases(purchases) : purchases;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function inventory(req, res, next) {
  try {
    const data = await purchaseService.getPurchaserInventory(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { ingredient_id, quantity, unit_price, size } = req.body;

    if (!ingredient_id) throw new AppError('INGREDIENT_REQUIRED', ERROR_CODES.INGREDIENT_REQUIRED, 400);
    if (!quantity || parseFloat(quantity) <= 0) {
      throw new AppError('QUANTITY_MUST_BE_POSITIVE', ERROR_CODES.QUANTITY_MUST_BE_POSITIVE, 400);
    }
    if (!unit_price || parseFloat(unit_price) <= 0) {
      throw new AppError('UNIT_PRICE_MUST_BE_POSITIVE', ERROR_CODES.UNIT_PRICE_MUST_BE_POSITIVE, 400);
    }

    const purchase = await purchaseService.createPurchase(req.user.id, {
      ingredient_id: parseInt(ingredient_id, 10),
      quantity: parseFloat(quantity),
      unit_price: parseFloat(unit_price),
      size: size || null,
      screenshot_path: req.file.filename,
    });
    res.status(201).json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
}

async function screenshot(req, res, next) {
  try {
    const purchase = await purchaseService.getPurchaseForScreenshot(req.params.id, req.user);
    const filePath = path.join(UPLOAD_DIR, purchase.screenshot_path);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

async function handToChief(req, res, next) {
  try {
    const purchase = await purchaseService.handPurchaseToChief(
      req.params.id,
      req.user.id
    );
    res.json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
}

async function receive(req, res, next) {
  try {
    const purchase = await purchaseService.receivePurchase(req.params.id, req.user.id);
    res.json({ success: true, data: redactPurchase(purchase) });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const purchase = await purchaseService.updatePurchaseUnitPrice(
      req.params.id,
      req.body.unit_price
    );
    res.json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, inventory, create, screenshot, handToChief, receive, update };
