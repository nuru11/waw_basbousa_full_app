const { sequelize, Sale, Dish, Admin, Ingredient, StockMovement } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const posDefaultPriceService = require('./posDefaultPriceService');
const coffeeService = require('./coffeeService');
const waterService = require('./waterService');
const { getDateRange } = require('../utils/dateUtils');

const WEIGHT_PRICE_FIELD = {
  quarter: 'price_quarter',
  half: 'price_half',
  kilo: 'price_kilo',
  slice: 'price_per_slice',
  half_slice: 'price_half_slice',
};

function getPriceFromSource(source, weightType) {
  const field = WEIGHT_PRICE_FIELD[weightType];
  const price = source[field];
  if (price === null || price === undefined) {
    throw new AppError('PRICE_NOT_SET', ERROR_CODES.PRICE_NOT_SET, 400, { weightType });
  }
  return parseFloat(price);
}

function calculateUnitPrice(dish, weightType) {
  return getPriceFromSource(dish, weightType);
}

function calculateTotalPrice(unitPrice, weightType, quantity, sliceCount) {
  const q = quantity || 1;
  if (weightType === 'slice') {
    if (!sliceCount || sliceCount < 1) {
      throw new AppError('SLICE_COUNT_REQUIRED', ERROR_CODES.SLICE_COUNT_REQUIRED, 422);
    }
    return unitPrice * sliceCount * q;
  }
  return unitPrice * q;
}

function calculateKiloConsumed(weightType, quantity, sliceCount) {
  const q = quantity || 1;
  switch (weightType) {
    case 'quarter':
      return 0.25 * q;
    case 'half':
      return 0.5 * q;
    case 'kilo':
      return 1.0 * q;
    case 'slice': {
      if (!sliceCount || sliceCount < 1) {
        throw new AppError('SLICE_COUNT_REQUIRED', ERROR_CODES.SLICE_COUNT_REQUIRED, 422);
      }
      return ((sliceCount / 3) * 0.25) * q;
    }
    case 'half_slice':
      return 0.5 * (0.25 / 3) * q;
    default:
      throw new AppError('INVALID_WEIGHT_TYPE', ERROR_CODES.INVALID_WEIGHT_TYPE, 422);
  }
}

async function validateSeller(sellerId) {
  const seller = await Admin.findByPk(sellerId);
  if (!seller || seller.status !== 'active') {
    throw new AppError('SELLER_NOT_FOUND', ERROR_CODES.SELLER_NOT_FOUND, 404);
  }
  if (!['employee', 'chief'].includes(seller.role)) {
    throw new AppError('SELLER_INVALID_ROLE', ERROR_CODES.SELLER_INVALID_ROLE, 422);
  }
  return seller;
}

async function listSellers() {
  return Admin.findAll({
    where: {
      role: { [Op.in]: ['employee', 'chief'] },
      status: 'active',
    },
    attributes: ['id', 'name', 'short_id', 'role'],
    order: [['name', 'ASC']],
  });
}

async function deductIngredientOnSale(ingredientId, amountUsed, saleId, userId, transaction, notes) {
  const ingredient = await Ingredient.findByPk(ingredientId, {
    lock: transaction.LOCK.UPDATE,
    transaction,
  });
  if (!ingredient) {
    throw new AppError('INGREDIENT_NOT_FOUND', ERROR_CODES.INGREDIENT_NOT_FOUND, 404);
  }

  const newStock = parseFloat(ingredient.current_stock) - amountUsed;
  if (newStock < 0) {
    throw new AppError('INSUFFICIENT_STOCK', ERROR_CODES.INSUFFICIENT_STOCK, 400);
  }

  await ingredient.update({ current_stock: newStock }, { transaction });

  await StockMovement.create(
    {
      ingredient_id: ingredientId,
      type: 'sale',
      quantity_delta: -amountUsed,
      reference_id: saleId,
      notes,
      created_by: userId,
    },
    { transaction }
  );
}

async function restoreIngredientOnSale(ingredientId, amountRestored, saleId, userId, transaction, notes) {
  const ingredient = await Ingredient.findByPk(ingredientId, {
    lock: transaction.LOCK.UPDATE,
    transaction,
  });
  if (!ingredient) {
    throw new AppError('INGREDIENT_NOT_FOUND', ERROR_CODES.INGREDIENT_NOT_FOUND, 404);
  }

  const newStock = parseFloat(ingredient.current_stock) + amountRestored;
  await ingredient.update({ current_stock: newStock }, { transaction });

  await StockMovement.create(
    {
      ingredient_id: ingredientId,
      type: 'adjustment',
      quantity_delta: amountRestored,
      reference_id: saleId,
      notes,
      created_by: userId,
    },
    { transaction }
  );
}

async function restoreCoffeeStockForEdit(sale, saleId, userId, transaction) {
  const oldKg = parseFloat(sale.kilo_consumed) || 0;
  if (oldKg <= 0) return;

  const { ingredient } = await coffeeService.getSettingsForSale({ transaction });
  await restoreIngredientOnSale(
    ingredient.id,
    oldKg,
    saleId,
    userId,
    transaction,
    'Coffee sale edit reversal'
  );
}

async function restoreWaterStockForEdit(sale, saleId, userId, transaction) {
  const oldQty = sale.quantity || 0;
  if (oldQty <= 0) return;

  await waterService.restoreStockOnSaleEdit(
    oldQty,
    sale.water_bottle_size ?? 'small',
    saleId,
    userId,
    transaction
  );
}

async function resolveCoffeeSaleLine(item, transaction) {
  const quantity = item.quantity || 1;
  const { settings, ingredient } = await coffeeService.getSettingsForSale({ transaction });
  const cupsPerKg = parseFloat(settings.cups_per_kg);
  const kgUsed = quantity / cupsPerKg;
  const unitPrice = parseFloat(settings.price_per_cup);
  const totalPrice = unitPrice * quantity;

  return {
    sale_type: 'coffee',
    dish_id: null,
    weight_type: null,
    slice_count: null,
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
    kilo_consumed: kgUsed,
    ingredient_id: ingredient.id,
    kg_to_deduct: kgUsed,
  };
}

async function resolveWaterSaleLine(item, transaction) {
  const quantity = item.quantity || 1;
  const bottleSize = item.water_bottle_size === 'large' ? 'large' : 'small';
  const { settings, unitPrice } = await waterService.getSettingsForSale({
    transaction,
    bottleSize,
  });
  const bottlesUsed = quantity;
  const totalPrice = unitPrice * quantity;
  const stockBottles = waterService.getStockForSize(settings, bottleSize);
  if (stockBottles < bottlesUsed) {
    throw new AppError('INSUFFICIENT_STOCK', ERROR_CODES.INSUFFICIENT_STOCK, 400);
  }

  return {
    sale_type: 'water',
    dish_id: null,
    weight_type: null,
    slice_count: null,
    water_bottle_size: bottleSize,
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
    kilo_consumed: bottlesUsed,
    stock_to_deduct: bottlesUsed,
  };
}

async function deductBeverageStock(line, saleId, userId, transaction) {
  if (line.sale_type === 'coffee') {
    await deductIngredientOnSale(
      line.ingredient_id,
      line.kg_to_deduct,
      saleId,
      userId,
      transaction,
      'Coffee sale'
    );
    return;
  }
  if (line.sale_type === 'water') {
    await waterService.deductStockOnSale(
      line.stock_to_deduct,
      line.water_bottle_size ?? 'small',
      saleId,
      userId,
      transaction
    );
  }
}

async function resolveSaleLine(item, transaction) {
  if (item.sale_type === 'coffee') {
    return resolveCoffeeSaleLine(item, transaction);
  }
  if (item.sale_type === 'water') {
    return resolveWaterSaleLine(item, transaction);
  }

  const quantity = item.quantity || 1;
  let dish = null;
  let dishId = null;
  let unitPrice;

  if (item.dish_id != null && item.dish_id !== '') {
    dishId = parseInt(item.dish_id, 10);
    dish = await Dish.findByPk(dishId, { transaction });
    if (!dish || !dish.is_active) {
      throw new AppError('DISH_NOT_FOUND_OR_INACTIVE', ERROR_CODES.DISH_NOT_FOUND_OR_INACTIVE, 404);
    }
    unitPrice = calculateUnitPrice(dish, item.weight_type);
  } else {
    unitPrice = await posDefaultPriceService.resolveCashierUnitPrice(item.weight_type, {
      transaction,
    });
  }

  const totalPrice = calculateTotalPrice(
    unitPrice,
    item.weight_type,
    quantity,
    item.slice_count
  );
  const kiloConsumed =
    item.kilo_consumed != null && parseFloat(item.kilo_consumed) > 0
      ? parseFloat(item.kilo_consumed)
      : calculateKiloConsumed(item.weight_type, quantity, item.slice_count);

  return {
    sale_type: 'plate',
    dish_id: dishId,
    dish,
    weight_type: item.weight_type,
    slice_count: item.weight_type === 'slice' ? item.slice_count : null,
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
    kilo_consumed: kiloConsumed,
  };
}

async function createSalesBatch(userId, data) {
  const transaction = await sequelize.transaction();

  try {
    const sellerId = data.seller_id ? parseInt(data.seller_id, 10) : userId;
    await validateSeller(sellerId);

    const lines = [];
    for (const item of data.items) {
      lines.push(await resolveSaleLine(item, transaction));
    }

    const soldAt = new Date();
    const paymentMethod = data.payment_method || 'cash';
    const tipAmount =
      paymentMethod === 'cash'
        ? 0
        : Math.max(0, parseFloat(data.tip_amount) || 0);
    const saleIds = [];
    let orderTotal = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const sale = await Sale.create(
        {
          dish_id: line.dish_id,
          sale_type: line.sale_type || 'plate',
          seller_id: sellerId,
          weight_type: line.weight_type,
          slice_count: line.slice_count,
          water_bottle_size: line.water_bottle_size ?? null,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_price: line.total_price,
          kilo_consumed: line.kilo_consumed,
          payment_method: paymentMethod,
          tip_amount: i === 0 ? tipAmount : 0,
          sold_at: soldAt,
        },
        { transaction }
      );

      if (line.sale_type === 'coffee' || line.sale_type === 'water') {
        await deductBeverageStock(line, sale.id, sellerId, transaction);
      }

      saleIds.push(sale.id);
      orderTotal += parseFloat(line.total_price);
    }

    orderTotal += tipAmount;

    await transaction.commit();

    const sales = await Sale.findAll({
      where: { id: saleIds },
      include: [
        { model: Dish, as: 'dish' },
        { model: Admin, as: 'seller', attributes: ['id', 'name', 'short_id', 'role'] },
      ],
      order: [['id', 'ASC']],
    });

    return { sales, order_total: orderTotal };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function createSale(userId, data) {
  const transaction = await sequelize.transaction();

  try {
    const sellerId = data.seller_id ? parseInt(data.seller_id, 10) : userId;
    await validateSeller(sellerId);

    const line = await resolveSaleLine(data, transaction);

    const paymentMethod = data.payment_method || 'cash';
    const tipAmount =
      paymentMethod === 'cash'
        ? 0
        : Math.max(0, parseFloat(data.tip_amount) || 0);

    const sale = await Sale.create(
      {
        dish_id: line.dish_id,
        sale_type: line.sale_type || 'plate',
        seller_id: sellerId,
        weight_type: line.weight_type,
        slice_count: line.slice_count,
        water_bottle_size: line.water_bottle_size ?? null,
        quantity: line.quantity,
        unit_price: line.unit_price,
        total_price: line.total_price,
        kilo_consumed: line.kilo_consumed,
        payment_method: paymentMethod,
        tip_amount: tipAmount,
        sold_at: new Date(),
      },
      { transaction }
    );

    if (line.sale_type === 'coffee' || line.sale_type === 'water') {
      await deductBeverageStock(line, sale.id, sellerId, transaction);
    }

    await transaction.commit();

    return Sale.findByPk(sale.id, {
      include: [
        { model: Dish, as: 'dish' },
        { model: Admin, as: 'seller', attributes: ['id', 'name', 'short_id', 'role'] },
      ],
    });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function listSales({ sellerId, limit = 100 } = {}) {
  const where = sellerId ? { seller_id: sellerId } : {};
  return Sale.findAll({
    where,
    include: [
      { model: Dish, as: 'dish' },
      { model: Admin, as: 'seller', attributes: ['id', 'name', 'short_id', 'role'] },
    ],
    order: [['sold_at', 'DESC']],
    limit,
  });
}

async function getMySales(sellerId) {
  return listSales({ sellerId });
}

function isSaleEditableToday(soldAt) {
  const { start, end } = getDateRange();
  const sold = new Date(soldAt);
  return sold >= start && sold <= end;
}

async function listTodaySales() {
  const { start, end } = getDateRange();
  return Sale.findAll({
    where: { sold_at: { [Op.between]: [start, end] } },
    include: [
      { model: Dish, as: 'dish' },
      { model: Admin, as: 'seller', attributes: ['id', 'name', 'short_id', 'role'] },
    ],
    order: [['sold_at', 'DESC']],
  });
}

async function updateSale(saleId, data) {
  const transaction = await sequelize.transaction();

  try {
    const sale = await Sale.findByPk(saleId, { transaction });
    if (!sale) {
      throw new AppError('SALE_NOT_FOUND', ERROR_CODES.SALE_NOT_FOUND, 404);
    }
    if (!isSaleEditableToday(sale.sold_at)) {
      throw new AppError('SALE_NOT_EDITABLE', ERROR_CODES.SALE_NOT_EDITABLE, 403);
    }

    const paymentMethod = data.payment_method ?? sale.payment_method;
    const tipAmount =
      paymentMethod === 'cash'
        ? 0
        : data.tip_amount != null
          ? Math.max(0, parseFloat(data.tip_amount) || 0)
          : parseFloat(sale.tip_amount) || 0;

    const sellerId =
      data.seller_id != null ? parseInt(data.seller_id, 10) : sale.seller_id;
    await validateSeller(sellerId);

    if (sale.sale_type === 'coffee') {
      const quantity = data.quantity != null ? parseInt(data.quantity, 10) : sale.quantity;

      await restoreCoffeeStockForEdit(sale, saleId, sellerId, transaction);
      const line = await resolveCoffeeSaleLine({ quantity }, transaction);
      await deductBeverageStock(line, saleId, sellerId, transaction);

      await sale.update(
        {
          seller_id: sellerId,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_price: line.total_price,
          kilo_consumed: line.kilo_consumed,
          payment_method: paymentMethod,
          tip_amount: tipAmount,
        },
        { transaction }
      );
    } else if (sale.sale_type === 'water') {
      const quantity = data.quantity != null ? parseInt(data.quantity, 10) : sale.quantity;
      const waterBottleSize = data.water_bottle_size ?? sale.water_bottle_size ?? 'small';

      await restoreWaterStockForEdit(sale, saleId, sellerId, transaction);
      const line = await resolveWaterSaleLine(
        { quantity, water_bottle_size: waterBottleSize },
        transaction
      );
      await deductBeverageStock(line, saleId, sellerId, transaction);

      await sale.update(
        {
          seller_id: sellerId,
          quantity: line.quantity,
          water_bottle_size: line.water_bottle_size,
          unit_price: line.unit_price,
          total_price: line.total_price,
          kilo_consumed: line.kilo_consumed,
          payment_method: paymentMethod,
          tip_amount: tipAmount,
        },
        { transaction }
      );
    } else {
      const weightType = data.weight_type ?? sale.weight_type;
      const quantity = data.quantity != null ? parseInt(data.quantity, 10) : sale.quantity;
      const sliceCount =
        weightType === 'slice'
          ? data.slice_count != null
            ? parseInt(data.slice_count, 10)
            : sale.slice_count
          : null;

      const lineInput = {
        dish_id: sale.dish_id,
        weight_type: weightType,
        quantity,
        slice_count: sliceCount,
        kilo_consumed: data.kilo_consumed,
      };

      const line = await resolveSaleLine(lineInput, transaction);

      await sale.update(
        {
          seller_id: sellerId,
          weight_type: line.weight_type,
          slice_count: line.slice_count,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_price: line.total_price,
          kilo_consumed: line.kilo_consumed,
          payment_method: paymentMethod,
          tip_amount: tipAmount,
        },
        { transaction }
      );
    }

    await transaction.commit();

    return Sale.findByPk(sale.id, {
      include: [
        { model: Dish, as: 'dish' },
        { model: Admin, as: 'seller', attributes: ['id', 'name', 'short_id', 'role'] },
      ],
    });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  createSale,
  createSalesBatch,
  listSales,
  getMySales,
  listTodaySales,
  updateSale,
  listSellers,
  calculateUnitPrice,
  calculateTotalPrice,
  calculateKiloConsumed,
};
