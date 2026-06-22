const { Op, fn, col, literal } = require('sequelize');
const {
  Purchase,
  Sale,
  Ingredient,
  Dish,
  StockMovement,
  Admin,
  ProductionLog,
} = require('../models');
const { getDateRange } = require('../utils/dateUtils');
const stockService = require('./stockService');
const { createEmptyPayments } = require('../constants/paymentMethods');

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

  const pendingPurchases = await Purchase.count({ where: { status: 'pending' } });

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
      { model: Admin, as: 'seller', attributes: ['id', 'name', 'short_id', 'role'] },
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

async function getDailySalesOverview(dateInput) {
  const { start, end, date } = getDateRange(dateInput);

  const sales = await Sale.findAll({
    where: { sold_at: { [Op.between]: [start, end] } },
    include: [
      { model: Dish, as: 'dish' },
      { model: Admin, as: 'seller', attributes: ['id', 'name', 'short_id', 'role'] },
    ],
    order: [['sold_at', 'DESC']],
  });

  const payments = createEmptyPayments();
  let totalRevenue = 0;
  let kiloSold = 0;

  const dishSalesMap = new Map();
  const sellerMap = new Map();

  for (const sale of sales) {
    const revenue = parseFloat(sale.total_price || 0);
    const kilo = parseFloat(sale.kilo_consumed || 0);
    totalRevenue += revenue;
    kiloSold += kilo;

    const method = sale.payment_method || 'other';
    if (payments[method] !== undefined) {
      payments[method] += revenue;
    } else {
      payments.other += revenue;
    }

    const dishId = sale.dish_id;
    if (!dishSalesMap.has(dishId)) {
      dishSalesMap.set(dishId, {
        dish_id: dishId,
        dish_name: sale.dish?.name ?? `Plate #${dishId}`,
        revenue: 0,
        sale_count: 0,
        sold_kg: 0,
      });
    }
    const dishRow = dishSalesMap.get(dishId);
    dishRow.revenue += revenue;
    dishRow.sale_count += 1;
    dishRow.sold_kg += kilo;

    const sellerId = sale.seller_id;
    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, {
        seller_id: sellerId,
        seller_name: sale.seller?.name ?? `Staff #${sellerId}`,
        role: sale.seller?.role ?? null,
        revenue: 0,
        sale_count: 0,
        kilo_sold: 0,
      });
    }
    const sellerRow = sellerMap.get(sellerId);
    sellerRow.revenue += revenue;
    sellerRow.sale_count += 1;
    sellerRow.kilo_sold += kilo;
  }

  const productionLogs = await ProductionLog.findAll({
    where: { logged_at: { [Op.between]: [start, end] } },
    attributes: ['dish_id'],
    group: ['dish_id'],
    raw: true,
  });

  const dishIds = new Set([
    ...productionLogs.map((l) => l.dish_id),
    ...dishSalesMap.keys(),
  ]);

  const byDish = [];
  for (const dishId of dishIds) {
    const stock = await stockService.getPlateAvailabilityForDate(dishId, date);
    const salesRow = dishSalesMap.get(dishId);
    const dish = await Dish.findByPk(dishId, { attributes: ['id', 'name'] });

    byDish.push({
      dish_id: dishId,
      dish_name: dish?.name ?? salesRow?.dish_name ?? `Plate #${dishId}`,
      produced_kg: stock.produced_kg,
      produced_plates: stock.produced_plates,
      sold_kg: stock.sold_kg,
      remaining_kg: stock.remaining_kg,
      revenue: salesRow?.revenue ?? 0,
      sale_count: salesRow?.sale_count ?? 0,
    });
  }

  byDish.sort((a, b) => b.revenue - a.revenue || a.dish_name.localeCompare(b.dish_name));

  const bySeller = [...sellerMap.values()].sort(
    (a, b) => b.revenue - a.revenue || a.seller_name.localeCompare(b.seller_name)
  );

  return {
    date,
    summary: {
      total_revenue: totalRevenue,
      sale_count: sales.length,
      kilo_sold: kiloSold,
      payments,
    },
    by_dish: byDish,
    by_seller: bySeller,
    sales,
  };
}

module.exports = {
  getSummary,
  getPurchasesReport,
  getSalesReport,
  getStockMovements,
  getDailySalesOverview,
};
