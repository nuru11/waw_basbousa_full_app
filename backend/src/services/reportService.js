const { Op, fn, col, literal } = require('sequelize');
const {
  Purchase,
  Sale,
  Ingredient,
  Dish,
  StockMovement,
  Admin,
  ProductionLog,
  Expense,
  ChiefExpense,
} = require('../models');
const { getDateRange, getMonthRange, formatPayPeriodLabel, formatDateYmd } = require('../utils/dateUtils');
const stockService = require('./stockService');
const salaryService = require('./salaryService');
const { createEmptyPayments } = require('../constants/paymentMethods');

function saleDateYmd(soldAt) {
  if (!soldAt) return null;
  if (typeof soldAt === 'string') return soldAt.slice(0, 10);
  return formatDateYmd(soldAt);
}

function buildMonthDayMap(period) {
  const [year, month] = period.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const map = new Map();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    map.set(date, {
      date,
      income: 0,
      operating_expense: 0,
      ingredient_expense: 0,
    });
  }
  return map;
}

async function getSummary() {
  const [
    ingredientExpenseResult,
    operatingExpenseResult,
    incomeResult,
    purchaseCount,
    saleCount,
    lowStock,
    operatingByCategoryRows,
    chiefExpenseResult,
  ] = await Promise.all([
    Purchase.sum('total_price', { where: { status: 'received' } }),
    Expense.sum('amount'),
    Sale.sum('total_price'),
    Purchase.count({ where: { status: 'received' } }),
    Sale.count(),
    Ingredient.findAll({
      where: literal('current_stock <= min_stock'),
      order: [['current_stock', 'ASC']],
    }),
    Expense.findAll({
      attributes: ['category', [fn('SUM', col('amount')), 'total']],
      group: ['category'],
      raw: true,
    }),
    ChiefExpense.sum('amount'),
  ]);

  const ingredient_expense = parseFloat(ingredientExpenseResult || 0);
  const chief_expenses_total = parseFloat(chiefExpenseResult || 0);
  const operating_expense = parseFloat(operatingExpenseResult || 0) + chief_expenses_total;
  const expense = ingredient_expense + operating_expense;
  const income = parseFloat(incomeResult || 0);

  const expense_by_category = {
    rental: 0,
    salaries: 0,
    electricity: 0,
    other: 0,
    tips: 0,
    chief_expenses: chief_expenses_total,
  };
  for (const row of operatingByCategoryRows) {
    expense_by_category[row.category] = parseFloat(row.total || 0);
  }

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

  const activeInventory = await Purchase.count({
    where: { status: { [Op.in]: ['in_inventory', 'handed'] } },
  });

  return {
    expense,
    ingredient_expense,
    operating_expense,
    expense_by_category,
    income,
    net_profit: income - expense,
    purchase_count: purchaseCount,
    sale_count: saleCount,
    active_inventory: activeInventory,
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

async function getExpensesReport({ from, to, category } = {}) {
  const where = {};
  if (category && category !== 'all') where.category = category;
  if (from || to) {
    where.spent_at = {};
    if (from) where.spent_at[Op.gte] = from;
    if (to) where.spent_at[Op.lte] = to;
  }

  return Expense.findAll({
    where,
    include: [{ model: Admin, as: 'creator', attributes: ['id', 'name', 'short_id'] }],
    order: [['spent_at', 'DESC'], ['created_at', 'DESC']],
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
  let totalTips = 0;
  let kiloSold = 0;

  const dishSalesMap = new Map();
  const sellerMap = new Map();

  for (const sale of sales) {
    const tip = parseFloat(sale.tip_amount || 0);
    const lineRevenue = parseFloat(sale.total_price || 0) + tip;
    const dishRevenue = parseFloat(sale.total_price || 0);
    const kilo = parseFloat(sale.kilo_consumed || 0);
    totalRevenue += lineRevenue;
    totalTips += tip;
    kiloSold += kilo;

    const method = sale.payment_method || 'other';
    if (payments[method] !== undefined) {
      payments[method] += lineRevenue;
    } else {
      payments.other += lineRevenue;
    }

    const dishId = sale.dish_id;
    if (!dishSalesMap.has(dishId)) {
      dishSalesMap.set(dishId, {
        dish_id: dishId,
        dish_name: sale.dish?.name ?? (dishId == null ? null : `Plate #${dishId}`),
        revenue: 0,
        sale_count: 0,
        sold_kg: 0,
      });
    }
    const dishRow = dishSalesMap.get(dishId);
    dishRow.revenue += dishRevenue;
    dishRow.sale_count += 1;
    dishRow.sold_kg += kilo;

    const sellerId = sale.seller_id;
    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, {
        seller_id: sellerId,
        seller_name: sale.seller?.name ?? `Staff #${sellerId}`,
        role: sale.seller?.role ?? null,
        sales_revenue: 0,
        tips_total: 0,
        revenue: 0,
        sale_count: 0,
        kilo_sold: 0,
      });
    }
    const sellerRow = sellerMap.get(sellerId);
    sellerRow.sales_revenue += dishRevenue;
    sellerRow.tips_total += tip;
    sellerRow.revenue += lineRevenue;
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
    const salesRow = dishSalesMap.get(dishId);

    if (dishId == null) {
      if (salesRow) {
        byDish.push({
          dish_id: null,
          dish_name: salesRow.dish_name,
          produced_kg: 0,
          produced_plates: 0,
          sold_kg: salesRow.sold_kg,
          remaining_kg: null,
          revenue: salesRow.revenue,
          sale_count: salesRow.sale_count,
        });
      }
      continue;
    }

    const stock = await stockService.getPlateAvailabilityForDate(dishId, date);
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

  byDish.sort(
    (a, b) =>
      b.revenue - a.revenue ||
      (a.dish_name ?? '').localeCompare(b.dish_name ?? '')
  );

  const bySeller = [...sellerMap.values()].sort(
    (a, b) => b.revenue - a.revenue || a.seller_name.localeCompare(b.seller_name)
  );

  const platePool = await stockService.getTodayTotalPlatePool(date);

  return {
    date,
    summary: {
      total_revenue: totalRevenue,
      total_tips: totalTips,
      sale_count: sales.length,
      kilo_sold: kiloSold,
      payments,
      plate_pool: platePool,
    },
    by_dish: byDish,
    by_seller: bySeller,
    sales,
  };
}

async function getMonthlyAnalysis(periodInput) {
  const { period, start, end, fromYmd, toYmd } = getMonthRange(periodInput);

  const purchaseWhere = {
    status: 'received',
    received_at: { [Op.between]: [start, end] },
  };
  const expenseWhere = {
    spent_at: { [Op.between]: [fromYmd, toYmd] },
  };
  const chiefExpenseWhere = {
    spent_at: { [Op.between]: [fromYmd, toYmd] },
  };
  const saleWhere = {
    sold_at: { [Op.between]: [start, end] },
  };

  const [
    ingredientExpenseResult,
    purchaseCount,
    operatingExpenseResult,
    operatingByCategoryRows,
    sales,
    purchases,
    expenses,
    chiefExpenses,
    payrollData,
  ] = await Promise.all([
    Purchase.sum('total_price', { where: purchaseWhere }),
    Purchase.count({ where: purchaseWhere }),
    Expense.sum('amount', { where: expenseWhere }),
    Expense.findAll({
      attributes: ['category', [fn('SUM', col('amount')), 'total']],
      where: expenseWhere,
      group: ['category'],
      raw: true,
    }),
    Sale.findAll({
      where: saleWhere,
      include: [
        { model: Dish, as: 'dish', attributes: ['name'] },
        { model: Admin, as: 'seller', attributes: ['id', 'name', 'short_id', 'role'] },
      ],
      order: [['sold_at', 'ASC']],
    }),
    Purchase.findAll({
      where: purchaseWhere,
      attributes: ['total_price', 'received_at'],
      raw: true,
    }),
    Expense.findAll({
      where: expenseWhere,
      attributes: ['amount', 'spent_at'],
      raw: true,
    }),
    ChiefExpense.findAll({
      where: chiefExpenseWhere,
      attributes: ['amount', 'spent_at'],
      raw: true,
    }),
    salaryService.listPayroll({ period }),
  ]);

  const ingredient_expense = parseFloat(ingredientExpenseResult || 0);
  const chief_expenses_total = chiefExpenses.reduce(
    (sum, row) => sum + parseFloat(row.amount || 0),
    0
  );
  const operating_expense = parseFloat(operatingExpenseResult || 0) + chief_expenses_total;
  const expense = ingredient_expense + operating_expense;

  const expense_by_category = {
    rental: 0,
    salaries: 0,
    electricity: 0,
    other: 0,
    tips: 0,
    chief_expenses: chief_expenses_total,
  };
  for (const row of operatingByCategoryRows) {
    expense_by_category[row.category] = parseFloat(row.total || 0);
  }

  const payments = createEmptyPayments();
  const dishSalesMap = new Map();
  const sellerMap = new Map();
  let income = 0;

  for (const sale of sales) {
    const tip = parseFloat(sale.tip_amount || 0);
    const lineRevenue = parseFloat(sale.total_price || 0) + tip;
    const dishRevenue = parseFloat(sale.total_price || 0);
    income += lineRevenue;

    const method = sale.payment_method || 'other';
    if (payments[method] !== undefined) {
      payments[method] += lineRevenue;
    } else {
      payments.other += lineRevenue;
    }

    const dishId = sale.dish_id;
    if (!dishSalesMap.has(dishId)) {
      dishSalesMap.set(dishId, {
        dish_id: dishId,
        dish_name: sale.dish?.name ?? (dishId == null ? null : `Plate #${dishId}`),
        revenue: 0,
        sale_count: 0,
      });
    }
    const dishRow = dishSalesMap.get(dishId);
    dishRow.revenue += dishRevenue;
    dishRow.sale_count += 1;

    const sellerId = sale.seller_id;
    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, {
        seller_id: sellerId,
        seller_name: sale.seller?.name ?? `Staff #${sellerId}`,
        revenue: 0,
        sale_count: 0,
      });
    }
    const sellerRow = sellerMap.get(sellerId);
    sellerRow.revenue += lineRevenue;
    sellerRow.sale_count += 1;
  }

  const byDayMap = buildMonthDayMap(period);

  for (const sale of sales) {
    const date = saleDateYmd(sale.sold_at);
    if (!date || !byDayMap.has(date)) continue;
    const tip = parseFloat(sale.tip_amount || 0);
    byDayMap.get(date).income += parseFloat(sale.total_price || 0) + tip;
  }

  for (const purchase of purchases) {
    const date = saleDateYmd(purchase.received_at);
    if (!date || !byDayMap.has(date)) continue;
    byDayMap.get(date).ingredient_expense += parseFloat(purchase.total_price || 0);
  }

  for (const exp of expenses) {
    const date = typeof exp.spent_at === 'string' ? exp.spent_at.slice(0, 10) : saleDateYmd(exp.spent_at);
    if (!date || !byDayMap.has(date)) continue;
    byDayMap.get(date).operating_expense += parseFloat(exp.amount || 0);
  }

  for (const exp of chiefExpenses) {
    const date = typeof exp.spent_at === 'string' ? exp.spent_at.slice(0, 10) : saleDateYmd(exp.spent_at);
    if (!date || !byDayMap.has(date)) continue;
    byDayMap.get(date).operating_expense += parseFloat(exp.amount || 0);
  }

  const by_day = [...byDayMap.values()].map((row) => ({
    ...row,
    net: row.income - row.operating_expense - row.ingredient_expense,
  }));

  const top_dishes = [...dishSalesMap.values()].sort(
    (a, b) =>
      b.revenue - a.revenue ||
      (a.dish_name ?? '').localeCompare(b.dish_name ?? '')
  );

  const by_seller = [...sellerMap.values()].sort(
    (a, b) => b.revenue - a.revenue || a.seller_name.localeCompare(b.seller_name)
  );

  return {
    period,
    period_label: formatPayPeriodLabel(period),
    income,
    ingredient_expense,
    operating_expense,
    expense,
    expense_by_category,
    net_profit: income - expense,
    sale_count: sales.length,
    purchase_count: purchaseCount,
    payments,
    payroll: payrollData.summary,
    top_dishes,
    by_seller,
    by_day,
  };
}

module.exports = {
  getSummary,
  getPurchasesReport,
  getExpensesReport,
  getSalesReport,
  getStockMovements,
  getDailySalesOverview,
  getMonthlyAnalysis,
};
