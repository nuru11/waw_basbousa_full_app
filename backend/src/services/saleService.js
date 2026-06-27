const { sequelize, Sale, Dish, Admin } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const posDefaultPriceService = require('./posDefaultPriceService');

const WEIGHT_PRICE_FIELD = {
  quarter: 'price_quarter',
  half: 'price_half',
  kilo: 'price_kilo',
  slice: 'price_per_slice',
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

async function resolveSaleLine(item, transaction) {
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
    const saleIds = [];
    let orderTotal = 0;

    for (const line of lines) {
      const sale = await Sale.create(
        {
          dish_id: line.dish_id,
          seller_id: sellerId,
          weight_type: line.weight_type,
          slice_count: line.slice_count,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_price: line.total_price,
          kilo_consumed: line.kilo_consumed,
          payment_method: paymentMethod,
          sold_at: soldAt,
        },
        { transaction }
      );
      saleIds.push(sale.id);
      orderTotal += parseFloat(line.total_price);
    }

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

    const sale = await Sale.create(
      {
        dish_id: line.dish_id,
        seller_id: sellerId,
        weight_type: line.weight_type,
        slice_count: line.slice_count,
        quantity: line.quantity,
        unit_price: line.unit_price,
        total_price: line.total_price,
        kilo_consumed: line.kilo_consumed,
        payment_method: data.payment_method || 'cash',
        sold_at: new Date(),
      },
      { transaction }
    );

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

module.exports = {
  createSale,
  createSalesBatch,
  listSales,
  getMySales,
  listSellers,
  calculateUnitPrice,
  calculateTotalPrice,
  calculateKiloConsumed,
};
