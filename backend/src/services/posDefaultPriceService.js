const { PosDefaultPrice, Dish } = require('../models');

const SINGLETON_ID = 1;

const PRICE_FIELDS = ['price_quarter', 'price_half', 'price_kilo', 'price_per_slice'];

const WEIGHT_PRICE_FIELD = {
  quarter: 'price_quarter',
  half: 'price_half',
  kilo: 'price_kilo',
  slice: 'price_per_slice',
};

function parsePositivePrice(value) {
  if (value == null || value === '') return null;
  const n = parseFloat(value);
  return n > 0 ? n : null;
}

async function getDefaultPrices({ transaction } = {}) {
  let row = await PosDefaultPrice.findByPk(SINGLETON_ID, { transaction });
  if (!row) {
    row = await PosDefaultPrice.create({ id: SINGLETON_ID }, { transaction });
  }
  return row;
}

async function resolveCashierUnitPrice(weightType, { transaction } = {}) {
  const AppError = require('../utils/AppError');
  const ERROR_CODES = require('../constants/errorCodes');

  const field = WEIGHT_PRICE_FIELD[weightType];
  const defaults = await getDefaultPrices({ transaction });
  const fromDefault = parsePositivePrice(defaults[field]);
  if (fromDefault != null) return fromDefault;

  const dishes = await Dish.findAll({
    where: { is_active: true },
    transaction,
  });
  for (const dish of dishes) {
    const price = parsePositivePrice(dish[field]);
    if (price != null) return price;
  }

  throw new AppError('PRICE_NOT_SET', ERROR_CODES.PRICE_NOT_SET, 400, { weightType });
}

async function getEffectivePricesForCashier({ transaction } = {}) {
  const defaults = await getDefaultPrices({ transaction });
  const dishes = await Dish.findAll({
    where: { is_active: true },
    transaction,
  });

  const result = {};
  for (const field of PRICE_FIELDS) {
    const fromDefault = parsePositivePrice(defaults[field]);
    if (fromDefault != null) {
      result[field] = fromDefault;
      continue;
    }
    const dish = dishes.find((d) => parsePositivePrice(d[field]) != null);
    result[field] = dish ? parsePositivePrice(dish[field]) : null;
  }
  return result;
}

async function updateDefaultPrices(data) {
  const row = await getDefaultPrices();
  const updates = {};
  if (data.price_quarter !== undefined) {
    updates.price_quarter = data.price_quarter;
  }
  if (data.price_half !== undefined) {
    updates.price_half = data.price_half;
  }
  if (data.price_kilo !== undefined) {
    updates.price_kilo = data.price_kilo;
  }
  if (data.price_per_slice !== undefined) {
    updates.price_per_slice = data.price_per_slice;
  }
  await row.update(updates);
  return row;
}

module.exports = {
  getDefaultPrices,
  updateDefaultPrices,
  resolveCashierUnitPrice,
  getEffectivePricesForCashier,
};
