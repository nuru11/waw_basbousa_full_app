const { Sale, Dish, Admin } = require('../models');
const AppError = require('../utils/AppError');

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

async function createSale(employeeId, data) {
  const dish = await Dish.findByPk(data.dish_id);
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

  return Sale.create({
    dish_id: data.dish_id,
    employee_id: employeeId,
    weight_type: data.weight_type,
    slice_count: data.weight_type === 'slice' ? data.slice_count : null,
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
    payment_method: data.payment_method || 'cash',
    sold_at: new Date(),
  });
}

async function listSales({ employeeId, limit = 100 } = {}) {
  const where = employeeId ? { employee_id: employeeId } : {};
  return Sale.findAll({
    where,
    include: [
      { model: Dish, as: 'dish' },
      { model: Admin, as: 'employee', attributes: ['id', 'name', 'short_id'] },
    ],
    order: [['sold_at', 'DESC']],
    limit,
  });
}

async function getMySales(employeeId) {
  return listSales({ employeeId });
}

module.exports = {
  createSale,
  listSales,
  getMySales,
  calculateUnitPrice,
  calculateTotalPrice,
};
