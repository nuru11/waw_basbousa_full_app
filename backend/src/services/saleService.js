const { sequelize, Sale, Dish, Admin } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
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
    throw new AppError(`Price not set for weight type: ${weightType}`, 400);
  }
  return parseFloat(price);
}

function calculateTotalPrice(dish, weightType, quantity, sliceCount) {
  const unitPrice = calculateUnitPrice(dish, weightType);
  if (weightType === 'slice') {
    if (!sliceCount || sliceCount < 1) {
      throw new AppError('Slice count is required for slice sales', 422);
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
        throw new AppError('Slice count is required for slice sales', 422);
      }
      return ((sliceCount / 3) * 0.25) * q;
    }
    default:
      throw new AppError('Invalid weight type', 422);
  }
}

async function validateSeller(sellerId) {
  const seller = await Admin.findByPk(sellerId);
  if (!seller || seller.status !== 'active') {
    throw new AppError('Seller not found or inactive', 404);
  }
  if (!['employee', 'chief'].includes(seller.role)) {
    throw new AppError('Seller must be an employee or chief', 422);
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

async function createSale(userId, data) {
  const transaction = await sequelize.transaction();

  try {
    const sellerId = data.seller_id ? parseInt(data.seller_id, 10) : userId;
    await validateSeller(sellerId);

    const dish = await Dish.findByPk(data.dish_id, { transaction });
    if (!dish || !dish.is_active) {
      throw new AppError('Dish not found or inactive', 404);
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
        `Insufficient plate stock for today. Available: ${availability.available_kg.toFixed(3)} kg, need: ${kiloConsumed.toFixed(3)} kg`,
        400
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
  listSales,
  getMySales,
  listSellers,
  calculateUnitPrice,
  calculateTotalPrice,
  calculateKiloConsumed,
};
