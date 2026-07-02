const { CoffeeSetting, Ingredient } = require('../models');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const SINGLETON_ID = 1;

async function getSettingsRow({ transaction } = {}) {
  let row = await CoffeeSetting.findByPk(SINGLETON_ID, { transaction });
  if (!row) {
    row = await CoffeeSetting.create({ id: SINGLETON_ID }, { transaction });
  }
  return row;
}

function computeAvailability(ingredient, cupsPerKg) {
  const stockKg = ingredient ? parseFloat(ingredient.current_stock) : 0;
  const rate = parseFloat(cupsPerKg) || 100;
  const availableCups = rate > 0 ? Math.floor(stockKg * rate) : 0;
  return {
    current_stock_kg: stockKg,
    available_cups: availableCups,
  };
}

async function getSettingsWithAvailability({ transaction } = {}) {
  const settings = await getSettingsRow({ transaction });
  let ingredient = null;
  if (settings.ingredient_id) {
    ingredient = await Ingredient.findByPk(settings.ingredient_id, { transaction });
  }

  const availability = computeAvailability(ingredient, settings.cups_per_kg);

  return {
    id: settings.id,
    ingredient_id: settings.ingredient_id,
    price_per_cup: settings.price_per_cup,
    cups_per_kg: settings.cups_per_kg,
    is_active: settings.is_active,
    ingredient: ingredient
      ? {
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          current_stock: ingredient.current_stock,
        }
      : null,
    ...availability,
  };
}

async function getSettingsForSale({ transaction } = {}) {
  const settings = await getSettingsRow({ transaction });
  if (!settings.is_active) {
    throw new AppError('COFFEE_NOT_ACTIVE', ERROR_CODES.COFFEE_NOT_ACTIVE, 400);
  }
  if (!settings.ingredient_id) {
    throw new AppError('COFFEE_INGREDIENT_NOT_SET', ERROR_CODES.COFFEE_INGREDIENT_NOT_SET, 400);
  }
  if (settings.price_per_cup == null || parseFloat(settings.price_per_cup) <= 0) {
    throw new AppError('COFFEE_PRICE_NOT_SET', ERROR_CODES.COFFEE_PRICE_NOT_SET, 400);
  }
  const cupsPerKg = parseFloat(settings.cups_per_kg);
  if (!cupsPerKg || cupsPerKg <= 0) {
    throw new AppError('COFFEE_CUPS_PER_KG_INVALID', ERROR_CODES.COFFEE_CUPS_PER_KG_INVALID, 400);
  }

  const ingredient = await Ingredient.findByPk(settings.ingredient_id, {
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
    transaction,
  });
  if (!ingredient) {
    throw new AppError('INGREDIENT_NOT_FOUND', ERROR_CODES.INGREDIENT_NOT_FOUND, 404);
  }

  return { settings, ingredient };
}

async function updateSettings(data) {
  const settings = await getSettingsRow();

  if (data.ingredient_id !== undefined && data.ingredient_id !== null) {
    const ingredientId = parseInt(data.ingredient_id, 10);
    const ingredient = await Ingredient.findByPk(ingredientId);
    if (!ingredient) {
      throw new AppError('INGREDIENT_NOT_FOUND', ERROR_CODES.INGREDIENT_NOT_FOUND, 404);
    }
    await settings.update({ ingredient_id: ingredientId });
  } else if (data.ingredient_id === null) {
    await settings.update({ ingredient_id: null });
  }

  const updates = {};
  if (data.price_per_cup !== undefined) {
    updates.price_per_cup = data.price_per_cup;
  }
  if (data.cups_per_kg !== undefined) {
    const cupsPerKg = parseFloat(data.cups_per_kg);
    if (!cupsPerKg || cupsPerKg <= 0) {
      throw new AppError('COFFEE_CUPS_PER_KG_INVALID', ERROR_CODES.COFFEE_CUPS_PER_KG_INVALID, 400);
    }
    updates.cups_per_kg = cupsPerKg;
  }
  if (data.is_active !== undefined) {
    updates.is_active = !!data.is_active;
  }

  if (Object.keys(updates).length > 0) {
    await settings.update(updates);
  }

  return getSettingsWithAvailability();
}

async function isIngredientLinked(ingredientId) {
  const settings = await getSettingsRow();
  return settings.ingredient_id === parseInt(ingredientId, 10);
}

module.exports = {
  getSettingsWithAvailability,
  getSettingsForSale,
  updateSettings,
  isIngredientLinked,
  computeAvailability,
};
