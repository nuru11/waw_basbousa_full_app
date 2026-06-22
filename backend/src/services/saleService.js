const { sequelize, Sale, Dish, Admin } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const stockService = require('./stockService');

function calculateUnitPrice(dish, weightType) {
  const priceMap = {
    quarter: dish.price_quarter,
    half: dish.price_half,
    kilo: dish.price_kilo,
    slice: dish.price_per_slice,
  };
  const price = priceMap[weightType];
  if (price === null || price === undefined) {
    throw new AppError('PRICE_NOT_SET', ERROR_CODES.PRICE_NOT_SET, 400, { weightType });
  }
  return parseFloat(price);
}

function calculateTotalPrice(dish, weightType, quantity, sliceCount) {
  const unitPrice = calculateUnitPrice(dish, weightType);
  if (weightType === 'slice') {
    if (!sliceCount || sliceCount < 1) {
      throw new AppError('SLICE_COUNT_REQUIRED', ERROR_CODES.SLICE_COUNT_REQUIRED, 422);
    }
    return unitPrice * sliceCount * quantity;
  }
  return unitPrice * quantity;
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
  const dish = await Dish.findByPk(item.dish_id, { transaction });
  if (!dish || !dish.is_active) {
    throw new AppError('DISH_NOT_FOUND_OR_INACTIVE', ERROR_CODES.DISH_NOT_FOUND_OR_INACTIVE, 404);
  }

  const quantity = item.quantity || 1;
  const unitPrice = calculateUnitPrice(dish, item.weight_type);
  const totalPrice = calculateTotalPrice(
    dish,
    item.weight_type,
    quantity,
    item.slice_count
  );
  const kiloConsumed = calculateKiloConsumed(
    item.weight_type,
    quantity,
    item.slice_count
  );

  return {
    dish_id: item.dish_id,
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

    const kiloByDish = new Map();
    for (const line of lines) {
      const current = kiloByDish.get(line.dish_id) || 0;
      kiloByDish.set(line.dish_id, current + line.kilo_consumed);
    }

    for (const [dishId, totalKilo] of kiloByDish) {
      const availability = await stockService.getTodayPlateAvailability(dishId, {
        transaction,
      });
      if (totalKilo > availability.available_kg + 0.0001) {
        throw new AppError(
          'INSUFFICIENT_PLATE_STOCK',
          ERROR_CODES.INSUFFICIENT_PLATE_STOCK,
          400,
          {
            available: availability.available_kg.toFixed(3),
            needed: totalKilo.toFixed(3),
          }
        );
      }
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

    const dish = await Dish.findByPk(data.dish_id, { transaction });
    if (!dish || !dish.is_active) {
      throw new AppError('DISH_NOT_FOUND_OR_INACTIVE', ERROR_CODES.DISH_NOT_FOUND_OR_INACTIVE, 404);
    }

    const quantity = data.quantity || 1;
    const unitPrice = calculateUnitPrice(dish, data.weight_type);
    const totalPrice = calculateTotalPrice(
      dish,
      data.weight_type,
      quantity,
      data.slice_count
    );
    const kiloConsumed = calculateKiloConsumed(
      data.weight_type,
      quantity,
      data.slice_count
    );

    const availability = await stockService.getTodayPlateAvailability(data.dish_id, {
      transaction,
    });

    if (kiloConsumed > availability.available_kg + 0.0001) {
      throw new AppError(
        'INSUFFICIENT_PLATE_STOCK',
        ERROR_CODES.INSUFFICIENT_PLATE_STOCK,
        400,
        {
          available: availability.available_kg.toFixed(3),
          needed: kiloConsumed.toFixed(3),
        }
      );
    }

    const sale = await Sale.create(
      {
        dish_id: data.dish_id,
        seller_id: sellerId,
        weight_type: data.weight_type,
        slice_count: data.weight_type === 'slice' ? data.slice_count : null,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        kilo_consumed: kiloConsumed,
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
