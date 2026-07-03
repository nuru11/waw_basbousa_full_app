const { sequelize, WaterSetting, WaterStockMovement } = require('../models');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const SINGLETON_ID = 1;
const BOTTLE_SIZES = ['small', 'large'];

function normalizeBottleSize(size) {
  return size === 'large' ? 'large' : 'small';
}

function stockColumnForSize(bottleSize) {
  return normalizeBottleSize(bottleSize) === 'large'
    ? 'current_stock_large_bottles'
    : 'current_stock_small_bottles';
}

function parsePrice(value) {
  if (value == null || value === '') return null;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
}

function getPriceForSize(settings, bottleSize) {
  if (normalizeBottleSize(bottleSize) === 'large') {
    return parsePrice(settings.price_large_bottle);
  }
  return parsePrice(settings.price_per_bottle);
}

function getStockForSize(settings, bottleSize) {
  const column = stockColumnForSize(bottleSize);
  return parseFloat(settings[column]) || 0;
}

function hasAnyPrice(settings) {
  return BOTTLE_SIZES.some((size) => getPriceForSize(settings, size) != null);
}

async function getSettingsRow({ transaction, lock } = {}) {
  const options = { transaction };
  if (lock && transaction) {
    options.lock = transaction.LOCK.UPDATE;
  }
  let row = await WaterSetting.findByPk(SINGLETON_ID, options);
  if (!row) {
    row = await WaterSetting.create({ id: SINGLETON_ID }, { transaction });
  }
  return row;
}

function sizeAvailability(stockValue, minStock) {
  const stock = parseFloat(stockValue) || 0;
  return {
    current: stock,
    available: stock > 0 ? Math.floor(stock) : 0,
    low_stock: stock < minStock,
  };
}

function computeAvailability(settings) {
  const minStock = parseFloat(settings.min_stock_bottles) || 0;
  const small = sizeAvailability(settings.current_stock_small_bottles, minStock);
  const large = sizeAvailability(settings.current_stock_large_bottles, minStock);

  return {
    current_stock_small_bottles: small.current,
    available_small_bottles: small.available,
    low_stock_small: small.low_stock,
    current_stock_large_bottles: large.current,
    available_large_bottles: large.available,
    low_stock_large: large.low_stock,
    min_stock_bottles: minStock,
    current_stock_bottles: small.current + large.current,
    available_bottles: small.available + large.available,
    low_stock: small.low_stock || large.low_stock,
  };
}

function formatSettingsResponse(settings) {
  return {
    id: settings.id,
    price_per_bottle: settings.price_per_bottle,
    price_large_bottle: settings.price_large_bottle,
    is_active: settings.is_active,
    ...computeAvailability(settings),
  };
}

async function getSettingsWithAvailability({ transaction } = {}) {
  const settings = await getSettingsRow({ transaction });
  return formatSettingsResponse(settings);
}

async function getSettingsForSale({ transaction, bottleSize = 'small' } = {}) {
  const normalizedSize = normalizeBottleSize(bottleSize);
  const settings = await getSettingsRow({ transaction, lock: true });
  if (!settings.is_active) {
    throw new AppError('WATER_NOT_ACTIVE', ERROR_CODES.WATER_NOT_ACTIVE, 400);
  }
  const unitPrice = getPriceForSize(settings, normalizedSize);
  if (unitPrice == null) {
    throw new AppError('WATER_PRICE_NOT_SET', ERROR_CODES.WATER_PRICE_NOT_SET, 400);
  }
  const stockBottles = getStockForSize(settings, normalizedSize);
  if (stockBottles <= 0) {
    throw new AppError('INSUFFICIENT_STOCK', ERROR_CODES.INSUFFICIENT_STOCK, 400);
  }
  return { settings, bottleSize: normalizedSize, unitPrice };
}

async function updateSettings(data) {
  const settings = await getSettingsRow();
  const updates = {};

  if (data.price_per_bottle !== undefined) {
    updates.price_per_bottle = data.price_per_bottle;
  }
  if (data.price_large_bottle !== undefined) {
    updates.price_large_bottle = data.price_large_bottle;
  }
  if (data.min_stock_bottles !== undefined) {
    updates.min_stock_bottles = Math.max(0, parseFloat(data.min_stock_bottles) || 0);
  }
  if (data.is_active !== undefined) {
    updates.is_active = !!data.is_active;
  }

  if (Object.keys(updates).length > 0) {
    await settings.update(updates);
  }

  return getSettingsWithAvailability();
}

async function applyStockDelta(settings, delta, { type, bottleSize, referenceId, notes, userId, transaction }) {
  const normalizedSize = normalizeBottleSize(bottleSize);
  const column = stockColumnForSize(normalizedSize);
  const currentStock = getStockForSize(settings, normalizedSize);
  const newStock = currentStock + delta;
  if (newStock < 0) {
    throw new AppError('INSUFFICIENT_STOCK', ERROR_CODES.INSUFFICIENT_STOCK, 400);
  }

  await settings.update({ [column]: newStock }, { transaction });

  await WaterStockMovement.create(
    {
      type,
      quantity_delta: delta,
      bottle_size: normalizedSize,
      reference_id: referenceId ?? null,
      notes: notes || null,
      created_by: userId,
    },
    { transaction }
  );

  return settings;
}

async function adjustStockBottles({ quantity_delta, bottle_size, notes }, userId) {
  const transaction = await sequelize.transaction();

  try {
    const settings = await getSettingsRow({ transaction, lock: true });
    const delta = parseFloat(quantity_delta);
    if (Number.isNaN(delta) || delta === 0) {
      throw new AppError('VALIDATION_QUANTITY_DELTA_REQUIRED', ERROR_CODES.VALIDATION_QUANTITY_DELTA_REQUIRED, 400);
    }
    if (!BOTTLE_SIZES.includes(bottle_size)) {
      throw new AppError('VALIDATION_FAILED', ERROR_CODES.VALIDATION_FAILED, 400);
    }

    await applyStockDelta(settings, delta, {
      type: 'adjustment',
      bottleSize: bottle_size,
      notes: notes || `Water ${bottle_size} bottle adjustment`,
      userId,
      transaction,
    });

    await transaction.commit();
    return getSettingsWithAvailability();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deductStockOnSale(bottlesUsed, bottleSize, saleId, userId, transaction) {
  const settings = await getSettingsRow({ transaction, lock: true });
  await applyStockDelta(settings, -bottlesUsed, {
    type: 'sale',
    bottleSize,
    referenceId: saleId,
    notes: `Water ${normalizeBottleSize(bottleSize)} bottle sale`,
    userId,
    transaction,
  });
}

async function restoreStockOnSaleEdit(bottles, bottleSize, saleId, userId, transaction) {
  const settings = await getSettingsRow({ transaction, lock: true });
  await applyStockDelta(settings, bottles, {
    type: 'adjustment',
    bottleSize,
    referenceId: saleId,
    notes: `Water ${normalizeBottleSize(bottleSize)} bottle sale edit reversal`,
    userId,
    transaction,
  });
}

module.exports = {
  getSettingsWithAvailability,
  getSettingsForSale,
  updateSettings,
  adjustStockBottles,
  deductStockOnSale,
  restoreStockOnSaleEdit,
  computeAvailability,
  getPriceForSize,
  getStockForSize,
  hasAnyPrice,
  normalizeBottleSize,
};
