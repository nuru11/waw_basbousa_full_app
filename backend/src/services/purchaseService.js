const {
  sequelize,
  Purchase,
  Ingredient,
  Admin,
  StockMovement,
} = require('../models');
const { fn, col, Op } = require('sequelize');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const {
  getTodayRange,
  getYesterdayRange,
  getStartOfWeek,
  getStartOfMonth,
  getStartOfQuarter,
} = require('../utils/dateUtils');
const { deductFromTransfers, rebuildTransferBalances } = require('./transferService');

const PURCHASE_DATE_FIELDS = ['created_at', 'handed_at', 'received_at', 'approved_at'];

const purchaseIncludes = [
  { model: Ingredient, as: 'ingredient' },
  { model: Admin, as: 'purchaser', attributes: ['id', 'name', 'short_id'] },
  { model: Admin, as: 'approver', attributes: ['id', 'name', 'short_id'] },
  { model: Admin, as: 'chief', attributes: ['id', 'name', 'short_id'] },
];

async function listPurchases({ purchaserId, status, period, dateField } = {}) {
  const where = {};
  if (purchaserId) where.purchaser_id = purchaserId;
  if (status) {
    where.status = status.includes(',')
      ? { [Op.in]: status.split(',') }
      : status;
  }

  if (period === 'today') {
    const field = PURCHASE_DATE_FIELDS.includes(dateField) ? dateField : 'created_at';
    const { start, end } = getTodayRange();
    where[field] = { [Op.between]: [start, end] };
  } else if (period === 'yesterday') {
    const { start, end } = getYesterdayRange();
    where.created_at = { [Op.between]: [start, end] };
  } else if (period === 'week') {
    where.created_at = { [Op.gte]: getStartOfWeek() };
  } else if (period === 'month') {
    where.created_at = { [Op.gte]: getStartOfMonth() };
  } else if (period === 'quarter') {
    where.created_at = { [Op.gte]: getStartOfQuarter() };
  }

  return Purchase.findAll({
    where,
    include: purchaseIncludes,
    order: [['created_at', 'DESC']],
  });
}

async function createPurchase(purchaserId, data) {
  const transaction = await sequelize.transaction();

  try {
    const ingredient = await Ingredient.findByPk(data.ingredient_id, { transaction });
    if (!ingredient) throw new AppError('INGREDIENT_NOT_FOUND', ERROR_CODES.INGREDIENT_NOT_FOUND, 404);

    const quantity = parseFloat(data.quantity);
    const unitPrice = parseFloat(data.unit_price);
    const totalPrice = quantity * unitPrice;
    const size = resolvePurchaseSize(ingredient, data.size);

    const purchase = await Purchase.create(
      {
        ingredient_id: data.ingredient_id,
        size,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        purchaser_id: purchaserId,
        screenshot_path: data.screenshot_path,
        status: 'in_inventory',
      },
      { transaction }
    );

    await deductFromTransfers(purchaserId, totalPrice, transaction);

    await transaction.commit();
    return purchase;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function handPurchaseToChief(purchaseId, purchaserId) {
  const transaction = await sequelize.transaction();

  try {
    const purchase = await Purchase.findByPk(purchaseId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!purchase) throw new AppError('PURCHASE_NOT_FOUND', ERROR_CODES.PURCHASE_NOT_FOUND, 404);
    if (purchase.purchaser_id !== purchaserId) {
      throw new AppError('FORBIDDEN', ERROR_CODES.FORBIDDEN, 403);
    }
    if (purchase.status !== 'in_inventory') {
      throw new AppError('PURCHASE_IN_INVENTORY_ONLY', ERROR_CODES.PURCHASE_IN_INVENTORY_ONLY, 400);
    }

    await purchase.update(
      {
        status: 'handed',
        handed_at: new Date(),
      },
      { transaction }
    );

    await transaction.commit();
    return Purchase.findByPk(purchaseId, { include: purchaseIncludes });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function receivePurchase(purchaseId, chiefId) {
  const transaction = await sequelize.transaction();

  try {
    const purchase = await Purchase.findByPk(purchaseId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!purchase) throw new AppError('PURCHASE_NOT_FOUND', ERROR_CODES.PURCHASE_NOT_FOUND, 404);
    if (purchase.status === 'received') {
      throw new AppError('PURCHASE_ALREADY_RECEIVED', ERROR_CODES.PURCHASE_ALREADY_RECEIVED, 400);
    }
    if (purchase.status !== 'handed') {
      throw new AppError('PURCHASE_MUST_BE_HANDED', ERROR_CODES.PURCHASE_MUST_BE_HANDED, 400);
    }

    const ingredient = await Ingredient.findByPk(purchase.ingredient_id, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    const newStock = parseFloat(ingredient.current_stock) + parseFloat(purchase.quantity);
    await ingredient.update({ current_stock: newStock }, { transaction });

    await purchase.update(
      {
        status: 'received',
        chief_id: chiefId,
        received_at: new Date(),
      },
      { transaction }
    );

    await StockMovement.create(
      {
        ingredient_id: purchase.ingredient_id,
        type: 'purchase',
        quantity_delta: purchase.quantity,
        reference_id: purchase.id,
        created_by: chiefId,
        notes: `Received purchase #${purchase.id}`,
      },
      { transaction }
    );

    await transaction.commit();
    return Purchase.findByPk(purchaseId, { include: purchaseIncludes });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function getPurchaserInventory(purchaserId) {
  const purchases = await Purchase.findAll({
    where: { purchaser_id: purchaserId, status: 'in_inventory' },
    include: purchaseIncludes,
    order: [['created_at', 'DESC']],
  });

  const aggregated = await Purchase.findAll({
    attributes: [
      'ingredient_id',
      'size',
      [fn('SUM', col('quantity')), 'total_quantity'],
    ],
    where: { purchaser_id: purchaserId, status: 'in_inventory' },
    include: [{ model: Ingredient, as: 'ingredient', attributes: ['id', 'name', 'unit', 'has_size'] }],
    group: [
      'ingredient_id',
      'size',
      'ingredient.id',
      'ingredient.name',
      'ingredient.unit',
      'ingredient.has_size',
    ],
    raw: false,
  });

  const summary = aggregated.map((row) => ({
    ingredient_id: row.ingredient_id,
    size: row.size,
    ingredient: row.ingredient,
    total_quantity: parseFloat(row.get('total_quantity')),
  }));

  return { summary, purchases };
}

async function getPurchaseForScreenshot(purchaseId, user) {
  const purchase = await Purchase.findByPk(purchaseId);
  if (!purchase || !purchase.screenshot_path) {
    throw new AppError('SCREENSHOT_NOT_FOUND', ERROR_CODES.SCREENSHOT_NOT_FOUND, 404);
  }

  const allowedRoles = ['superAdmin'];
  if (user.role === 'purchaser' && purchase.purchaser_id !== user.id) {
    throw new AppError('FORBIDDEN', ERROR_CODES.FORBIDDEN, 403);
  }
  if (!allowedRoles.includes(user.role) && user.role !== 'purchaser') {
    throw new AppError('FORBIDDEN', ERROR_CODES.FORBIDDEN, 403);
  }

  return purchase;
}

function resolvePurchaseSize(ingredient, size) {
  const requestedSize = size || null;
  const validSizes = ['small', 'large'];

  if (ingredient.has_size) {
    if (!requestedSize || !validSizes.includes(requestedSize)) {
      throw new AppError('PURCHASE_SIZE_REQUIRED', ERROR_CODES.PURCHASE_SIZE_REQUIRED, 400);
    }
    return requestedSize;
  }
  if (requestedSize) {
    throw new AppError('PURCHASE_SIZE_NOT_ALLOWED', ERROR_CODES.PURCHASE_SIZE_NOT_ALLOWED, 400);
  }
  return null;
}

async function applyReceivedStockChange({
  purchaseId,
  oldIngredientId,
  oldQuantity,
  newIngredientId,
  newQuantity,
  transaction,
}) {
  const oldId = Number(oldIngredientId);
  const newId = Number(newIngredientId);
  const ids = [...new Set([oldId, newId])].sort((a, b) => a - b);
  const locked = {};
  for (const id of ids) {
    const ingredient = await Ingredient.findByPk(id, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    if (!ingredient) {
      throw new AppError('INGREDIENT_NOT_FOUND', ERROR_CODES.INGREDIENT_NOT_FOUND, 404);
    }
    locked[id] = ingredient;
  }

  if (oldId === newId) {
    const ingredient = locked[newId];
    const delta = newQuantity - oldQuantity;
    if (delta !== 0) {
      const newStock = parseFloat(ingredient.current_stock) + delta;
      if (newStock < 0) {
        throw new AppError('STOCK_BELOW_ZERO', ERROR_CODES.STOCK_BELOW_ZERO, 400);
      }
      await ingredient.update({ current_stock: newStock }, { transaction });
    }
  } else {
    const oldIngredient = locked[oldId];
    const newIngredient = locked[newId];
    const oldStock = parseFloat(oldIngredient.current_stock) - oldQuantity;
    if (oldStock < 0) {
      throw new AppError('STOCK_BELOW_ZERO', ERROR_CODES.STOCK_BELOW_ZERO, 400);
    }
    await oldIngredient.update({ current_stock: oldStock }, { transaction });
    await newIngredient.update(
      { current_stock: parseFloat(newIngredient.current_stock) + newQuantity },
      { transaction }
    );
  }

  const movement = await StockMovement.findOne({
    where: { type: 'purchase', reference_id: purchaseId },
    transaction,
  });
  if (movement) {
    await movement.update(
      {
        ingredient_id: newId,
        quantity_delta: newQuantity,
      },
      { transaction }
    );
  }
}

async function updatePurchase(purchaseId, { ingredient_id, quantity, unit_price, size }, actor) {
  const transaction = await sequelize.transaction();

  try {
    const purchase = await Purchase.findByPk(purchaseId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!purchase) {
      throw new AppError('PURCHASE_NOT_FOUND', ERROR_CODES.PURCHASE_NOT_FOUND, 404);
    }

    if (actor?.role === 'purchaser') {
      if (Number(purchase.purchaser_id) !== Number(actor.id)) {
        throw new AppError('FORBIDDEN', ERROR_CODES.FORBIDDEN, 403);
      }
      if (purchase.status !== 'in_inventory') {
        throw new AppError('PURCHASE_NOT_EDITABLE', ERROR_CODES.PURCHASE_NOT_EDITABLE, 400);
      }
    }

    const unitPrice = parseFloat(unit_price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new AppError(
        'PURCHASE_INVALID_UNIT_PRICE',
        ERROR_CODES.PURCHASE_INVALID_UNIT_PRICE,
        400
      );
    }

    const newQuantity = parseFloat(quantity);
    if (!Number.isFinite(newQuantity) || newQuantity <= 0) {
      throw new AppError('QUANTITY_MUST_BE_POSITIVE', ERROR_CODES.QUANTITY_MUST_BE_POSITIVE, 400);
    }

    const newIngredientId = parseInt(ingredient_id, 10);
    if (!Number.isInteger(newIngredientId) || newIngredientId <= 0) {
      throw new AppError('INGREDIENT_REQUIRED', ERROR_CODES.INGREDIENT_REQUIRED, 400);
    }

    const newIngredient = await Ingredient.findByPk(newIngredientId, { transaction });
    if (!newIngredient) {
      throw new AppError('INGREDIENT_NOT_FOUND', ERROR_CODES.INGREDIENT_NOT_FOUND, 404);
    }

    const resolvedSize = resolvePurchaseSize(newIngredient, size);
    const totalPrice = Math.round(newQuantity * unitPrice * 100) / 100;

    if (purchase.status === 'received') {
      await applyReceivedStockChange({
        purchaseId: purchase.id,
        oldIngredientId: purchase.ingredient_id,
        oldQuantity: parseFloat(purchase.quantity),
        newIngredientId,
        newQuantity,
        transaction,
      });
    }

    await purchase.update(
      {
        ingredient_id: newIngredientId,
        size: resolvedSize,
        quantity: newQuantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      },
      { transaction }
    );

    await rebuildTransferBalances(purchase.purchaser_id, transaction);

    await transaction.commit();
    return Purchase.findByPk(purchaseId, { include: purchaseIncludes });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  listPurchases,
  createPurchase,
  handPurchaseToChief,
  receivePurchase,
  getPurchaserInventory,
  getPurchaseForScreenshot,
  updatePurchase,
};
