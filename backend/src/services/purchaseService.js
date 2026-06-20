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
const { getTodayRange } = require('../utils/dateUtils');
const { deductFromTransfers } = require('./transferService');

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
  if (status) where.status = status;

  if (period === 'today') {
    const field = PURCHASE_DATE_FIELDS.includes(dateField) ? dateField : 'created_at';
    const { start, end } = getTodayRange();
    where[field] = { [Op.between]: [start, end] };
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

    const purchase = await Purchase.create(
      {
        ingredient_id: data.ingredient_id,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        purchaser_id: purchaserId,
        screenshot_path: data.screenshot_path,
        status: 'pending',
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

async function approvePurchase(purchaseId, approverId) {
  const purchase = await Purchase.findByPk(purchaseId);
  if (!purchase) throw new AppError('PURCHASE_NOT_FOUND', ERROR_CODES.PURCHASE_NOT_FOUND, 404);
  if (purchase.status !== 'pending') {
    throw new AppError('PURCHASE_PENDING_ONLY', ERROR_CODES.PURCHASE_PENDING_ONLY, 400);
  }

  await purchase.update({
    status: 'in_inventory',
    approved_by: approverId,
    approved_at: new Date(),
  });

  return Purchase.findByPk(purchaseId, { include: purchaseIncludes });
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
      [fn('SUM', col('quantity')), 'total_quantity'],
    ],
    where: { purchaser_id: purchaserId, status: 'in_inventory' },
    include: [{ model: Ingredient, as: 'ingredient', attributes: ['id', 'name', 'unit'] }],
    group: ['ingredient_id', 'ingredient.id', 'ingredient.name', 'ingredient.unit'],
    raw: false,
  });

  const summary = aggregated.map((row) => ({
    ingredient_id: row.ingredient_id,
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

  const allowedRoles = ['superAdmin', 'chief'];
  if (user.role === 'purchaser' && purchase.purchaser_id !== user.id) {
    throw new AppError('FORBIDDEN', ERROR_CODES.FORBIDDEN, 403);
  }
  if (!allowedRoles.includes(user.role) && user.role !== 'purchaser') {
    throw new AppError('FORBIDDEN', ERROR_CODES.FORBIDDEN, 403);
  }

  return purchase;
}

module.exports = {
  listPurchases,
  createPurchase,
  approvePurchase,
  handPurchaseToChief,
  receivePurchase,
  getPurchaserInventory,
  getPurchaseForScreenshot,
};
