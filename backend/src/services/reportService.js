const { Op, fn, col, literal } = require('sequelize');
const {
  Purchase,
  Sale,
  Ingredient,
  Dish,
  StockMovement,
  Admin,
} = require('../models');

async function getSummary() {
  const [expenseResult, incomeResult, purchaseCount, saleCount, lowStock] =
    await Promise.all([
      Purchase.sum('total_price', { where: { status: 'received' } }),
      Sale.sum('total_price'),
      Purchase.count({ where: { status: 'received' } }),
      Sale.count(),
      Ingredient.findAll({
        where: literal('current_stock <= min_stock'),
        order: [['current_stock', 'ASC']],
      }),
    ]);

  const expense = parseFloat(expenseResult || 0);
  const income = parseFloat(incomeResult || 0);

  const topDishes = await Sale.findAll({
    attributes: [
      'dish_id',
      [fn('SUM', col('total_price')), 'total_revenue'],
      [fn('COUNT', col('Sale.id')), 'sale_count'],
    ],
    include: [{ model: Dish, as: 'dish', attributes: ['name'] }],
    group: ['dish_id', 'dish.id', 'dish.name'],
    order: [[literal('total_revenue'), 'DESC']],
    limit: 5,
    raw: false,
  });

  const pendingPurchases = await Purchase.count({ where: { status: 'handed' } });

  return {
    expense,
    income,
    net_profit: income - expense,
    purchase_count: purchaseCount,
    sale_count: saleCount,
    pending_purchases: pendingPurchases,
    low_stock: lowStock,
    top_dishes: topDishes,
  };
}

async function getPurchasesReport({ from, to, status } = {}) {
  const where = {};
  if (status) where.status = status;
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = new Date(from);
    if (to) where.created_at[Op.lte] = new Date(to);
  }

  return Purchase.findAll({
    where,
    include: [
      { model: Ingredient, as: 'ingredient' },
      { model: Admin, as: 'purchaser', attributes: ['id', 'name', 'short_id'] },
    ],
    order: [['created_at', 'DESC']],
  });
}

async function getSalesReport({ from, to } = {}) {
  const where = {};
  if (from || to) {
    where.sold_at = {};
    if (from) where.sold_at[Op.gte] = new Date(from);
    if (to) where.sold_at[Op.lte] = new Date(to);
  }

  return Sale.findAll({
    where,
    include: [
      { model: Dish, as: 'dish' },
      { model: Admin, as: 'employee', attributes: ['id', 'name', 'short_id'] },
    ],
    order: [['sold_at', 'DESC']],
  });
}

async function getStockMovements({ ingredientId, limit = 100 } = {}) {
  const where = ingredientId ? { ingredient_id: ingredientId } : {};
  return StockMovement.findAll({
    where,
    include: [
      { model: Ingredient, as: 'ingredient' },
      { model: Admin, as: 'creator', attributes: ['id', 'name', 'short_id'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
  });
}

module.exports = {
  getSummary,
  getPurchasesReport,
  getSalesReport,
  getStockMovements,
};
