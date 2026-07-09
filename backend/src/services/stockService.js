const {
  sequelize,
  Ingredient,
  ProductionLog,
  Dish,
  DishIngredient,
  StockMovement,
  Admin,
  Sale,
} = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { getTodayRange, getDateRange, formatDateYmd } = require('../utils/dateUtils');
const { plateWeightToKg } = require('../utils/plateWeight');
const { resolveProductionRecipe } = require('../utils/resolveProductionRecipe');

async function listStock() {
  return Ingredient.findAll({
    order: [['name', 'ASC']],
  });
}

async function adjustStock(ingredientId, { quantity_delta, notes }, userId, userRole) {
  const transaction = await sequelize.transaction();

  try {
    const ingredient = await Ingredient.findByPk(ingredientId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    if (!ingredient) throw new AppError('INGREDIENT_NOT_FOUND', ERROR_CODES.INGREDIENT_NOT_FOUND, 404);

    const delta = parseFloat(quantity_delta);
    if (userRole === 'chief' && delta < 0 && ingredient.auto_reduce) {
      throw new AppError(
        'AUTO_REDUCE_MANUAL_ONLY',
        ERROR_CODES.AUTO_REDUCE_MANUAL_ONLY,
        400
      );
    }

    const newStock = parseFloat(ingredient.current_stock) + delta;
    if (newStock < 0) {
      throw new AppError('STOCK_BELOW_ZERO', ERROR_CODES.STOCK_BELOW_ZERO, 400);
    }

    await ingredient.update({ current_stock: newStock }, { transaction });

    const movement = await StockMovement.create(
      {
        ingredient_id: ingredientId,
        type: 'adjustment',
        quantity_delta: delta,
        notes: notes || 'Manual adjustment',
        created_by: userId,
      },
      { transaction }
    );

    await transaction.commit();
    return { ingredient: await Ingredient.findByPk(ingredientId), movement };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

function sumProducedKg(logs) {
  return logs.reduce((sum, log) => {
    const stored =
      log.plate_weight_grams ?? log.dish?.plate_weight_grams ?? 0;
    const kgPerPlate = plateWeightToKg(stored);
    return sum + log.plates_count * kgPerPlate;
  }, 0);
}

function sumProducedPlates(logs) {
  return logs.reduce((sum, log) => sum + log.plates_count, 0);
}

async function getPlateAvailabilityForDate(dishId, dateInput, { transaction } = {}) {
  const { start, end } = getDateRange(dateInput);

  const logs = await ProductionLog.findAll({
    where: {
      dish_id: dishId,
      logged_at: { [Op.between]: [start, end] },
    },
    include: [{ model: Dish, as: 'dish', attributes: ['id', 'name', 'plate_weight_grams'] }],
    transaction,
  });

  const producedKg = sumProducedKg(logs);
  const producedPlates = sumProducedPlates(logs);

  const soldKg = parseFloat(
    (await Sale.sum('kilo_consumed', {
      where: {
        dish_id: dishId,
        sold_at: { [Op.between]: [start, end] },
      },
      transaction,
    })) || 0
  );

  const availableKg = producedKg - soldKg;

  return {
    dish_id: dishId,
    dish_name: logs[0]?.dish?.name ?? null,
    produced_kg: producedKg,
    produced_plates: producedPlates,
    sold_kg: soldKg,
    remaining_kg: availableKg,
    available_kg: availableKg,
  };
}

async function getTodayPlateAvailability(dishId, options = {}) {
  return getPlateAvailabilityForDate(dishId, undefined, options);
}

async function getTodayTotalPlatePool(dateInput, { transaction } = {}) {
  const { start, end } = getDateRange(dateInput);

  const logs = await ProductionLog.findAll({
    where: { logged_at: { [Op.between]: [start, end] } },
    include: [{ model: Dish, as: 'dish', attributes: ['plate_weight_grams'] }],
    transaction,
  });

  const producedKg = sumProducedKg(logs);

  const soldKg = parseFloat(
    (await Sale.sum('kilo_consumed', {
      where: { sold_at: { [Op.between]: [start, end] } },
      transaction,
    })) || 0
  );

  const availableKg = producedKg - soldKg;

  return {
    produced_kg: producedKg,
    sold_kg: soldKg,
    remaining_kg: availableKg,
    available_kg: availableKg,
  };
}

function recipeUsageKey(ingredientId, size) {
  return `${ingredientId}:${size ?? ''}`;
}

function buildUsageMap(ingredientUsage) {
  const map = new Map();
  for (const entry of ingredientUsage) {
    const key = recipeUsageKey(entry.ingredient_id, entry.size ?? null);
    if (map.has(key)) {
      throw new AppError(
        'INVALID_INGREDIENT_USAGE',
        ERROR_CODES.INVALID_INGREDIENT_USAGE,
        400
      );
    }
    map.set(key, parseFloat(entry.quantity_used));
  }
  return map;
}

function resolveIngredientUsed(item, platesCount, usageMap) {
  if (!usageMap) {
    return parseFloat(item.quantity_per_plate) * platesCount;
  }

  const key = recipeUsageKey(item.ingredient_id, item.size ?? null);
  if (!usageMap.has(key)) {
    throw new AppError(
      'INVALID_INGREDIENT_USAGE',
      ERROR_CODES.INVALID_INGREDIENT_USAGE,
      400
    );
  }

  return usageMap.get(key);
}

function formatQtyForNote(value) {
  const rounded = Math.round(parseFloat(value) * 1000) / 1000;
  return String(rounded);
}

function ingredientDisplayName(name, size) {
  if (size === 'small') return `${name} (Small)`;
  if (size === 'large') return `${name} (Large)`;
  return name;
}

function formatAdjustmentDelta(delta, ingredientName) {
  if (Math.abs(delta) < 0.001) return null;
  const qty = formatQtyForNote(Math.abs(delta));
  if (delta > 0) return `${qty}+ ${ingredientName}`;
  return `-${qty} ${ingredientName}`;
}

async function buildIngredientAdjustmentNotes(recipe, usageMap, platesCount, transaction) {
  const ingredientIds = [...new Set(recipe.map((item) => item.ingredient_id))];
  const ingredients = await Ingredient.findAll({
    where: { id: ingredientIds },
    transaction,
  });
  const nameById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.name]));

  const parts = [];
  for (const item of recipe) {
    const used = resolveIngredientUsed(item, platesCount, usageMap);
    const defaultQty = parseFloat(item.quantity_per_plate) * platesCount;
    const delta = used - defaultQty;
    const baseName = nameById.get(item.ingredient_id) ?? `Ingredient #${item.ingredient_id}`;
    const displayName = ingredientDisplayName(baseName, item.size ?? null);
    const part = formatAdjustmentDelta(delta, displayName);
    if (part) parts.push(part);
  }

  return parts.join(', ');
}

function mergeProductionNotes(adjustmentNotes, chiefNote) {
  const trimmedChiefNote = chiefNote?.trim() || '';
  if (adjustmentNotes) {
    return trimmedChiefNote ? `${adjustmentNotes} | ${trimmedChiefNote}` : adjustmentNotes;
  }
  return trimmedChiefNote || null;
}

async function resolveProductionChiefId(user, chiefIdFromBody) {
  if (user.role === 'chief') {
    return user.id;
  }

  if (user.role === 'employee') {
    const chiefId =
      chiefIdFromBody != null ? parseInt(chiefIdFromBody, 10) : null;
    if (!chiefId) {
      throw new AppError(
        'VALIDATION_CHIEF_REQUIRED',
        ERROR_CODES.VALIDATION_CHIEF_REQUIRED,
        422
      );
    }
    const chief = await Admin.findByPk(chiefId);
    if (!chief || chief.role !== 'chief' || chief.status !== 'active') {
      throw new AppError('INVALID_CHIEF', ERROR_CODES.INVALID_CHIEF, 422);
    }
    return chief.id;
  }

  throw new AppError('FORBIDDEN', ERROR_CODES.FORBIDDEN, 403);
}

async function logProduction(
  chiefId,
  { dish_id, plates_count, plate_weight_grams, notes, ingredient_usage }
) {
  const transaction = await sequelize.transaction();

  try {
    const dish = await Dish.findByPk(dish_id, {
      include: [{ model: DishIngredient, as: 'recipe' }],
      transaction,
    });
    if (!dish) throw new AppError('DISH_NOT_FOUND', ERROR_CODES.DISH_NOT_FOUND, 404);

    const recipe = dish.recipe || [];
    if (recipe.length === 0) {
      throw new AppError('DISH_NO_RECIPE', ERROR_CODES.DISH_NO_RECIPE, 400);
    }

    const ingredientIds = [...new Set(recipe.map((item) => item.ingredient_id))];
    const ingredients = await Ingredient.findAll({
      where: { id: ingredientIds },
      transaction,
    });
    const autoReduceById = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient.auto_reduce])
    );
    const hasSizeById = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient.has_size])
    );
    const stockById = new Map(
      ingredients.map((ingredient) => [
        ingredient.id,
        parseFloat(ingredient.current_stock),
      ])
    );
    const autoRecipe = recipe.filter((item) => autoReduceById.get(item.ingredient_id) !== false);

    const usageMap =
      ingredient_usage && ingredient_usage.length > 0
        ? buildUsageMap(ingredient_usage)
        : null;

    const effectiveAutoRecipe = resolveProductionRecipe(
      autoRecipe,
      stockById,
      hasSizeById,
      plates_count,
      usageMap
    );

    if (usageMap) {
      const recipeKeys = new Set(
        autoRecipe.map((item) => recipeUsageKey(item.ingredient_id, item.size ?? null))
      );
      const effectiveKeys = new Set(
        effectiveAutoRecipe.map((item) =>
          recipeUsageKey(item.ingredient_id, item.size ?? null)
        )
      );
      for (const key of usageMap.keys()) {
        if (!recipeKeys.has(key)) {
          throw new AppError(
            'INVALID_INGREDIENT_USAGE',
            ERROR_CODES.INVALID_INGREDIENT_USAGE,
            400
          );
        }
      }
      for (const key of effectiveKeys) {
        if (!usageMap.has(key)) {
          throw new AppError(
            'INVALID_INGREDIENT_USAGE',
            ERROR_CODES.INVALID_INGREDIENT_USAGE,
            400
          );
        }
      }
      if (usageMap.size !== effectiveAutoRecipe.length) {
        throw new AppError(
          'INVALID_INGREDIENT_USAGE',
          ERROR_CODES.INVALID_INGREDIENT_USAGE,
          400
        );
      }
    }

    const shortfallParts = [];

    for (const item of effectiveAutoRecipe) {
      const ingredient = await Ingredient.findByPk(item.ingredient_id, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });
      const used = resolveIngredientUsed(item, plates_count, usageMap);
      const currentStock = parseFloat(ingredient.current_stock);
      const actualDeducted = Math.min(used, Math.max(0, currentStock));

      if (used > actualDeducted) {
        const displayName = ingredientDisplayName(ingredient.name, item.size ?? null);
        shortfallParts.push(
          `${displayName} needed ${formatQtyForNote(used)}, deducted ${formatQtyForNote(actualDeducted)}`
        );
      }

      if (actualDeducted > 0) {
        const newStock = currentStock - actualDeducted;
        await ingredient.update({ current_stock: newStock }, { transaction });

        await StockMovement.create(
          {
            ingredient_id: item.ingredient_id,
            type: 'production',
            quantity_delta: -actualDeducted,
            reference_id: dish_id,
            notes: `Production: ${plates_count} plates of ${dish.name}`,
            created_by: chiefId,
          },
          { transaction }
        );
      }
    }

    const weightGrams =
      plate_weight_grams != null ? plate_weight_grams : dish.plate_weight_grams;

    if (plate_weight_grams != null) {
      await dish.update({ plate_weight_grams }, { transaction });
    }

    let finalNotes = notes?.trim() || '';
    if (usageMap) {
      const adjustmentNotes = await buildIngredientAdjustmentNotes(
        effectiveAutoRecipe,
        usageMap,
        plates_count,
        transaction
      );
      finalNotes = mergeProductionNotes(adjustmentNotes, finalNotes);
    } else {
      finalNotes = finalNotes || null;
    }

    if (shortfallParts.length > 0) {
      const shortfallNotes = `Stock shortfall: ${shortfallParts.join('; ')}`;
      finalNotes = finalNotes ? `${shortfallNotes} | ${finalNotes}` : shortfallNotes;
    }

    const log = await ProductionLog.create(
      {
        dish_id,
        plates_count,
        plate_weight_grams: weightGrams,
        chief_id: chiefId,
        notes: finalNotes,
        logged_at: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    return ProductionLog.findByPk(log.id, {
      include: [
        { model: Dish, as: 'dish' },
        { model: Admin, as: 'chief', attributes: ['id', 'name', 'short_id'] },
      ],
    });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function listProductionLogs({ period } = {}) {
  const where = {};
  if (period === 'today') {
    const { start, end } = getTodayRange();
    where.logged_at = { [Op.between]: [start, end] };
  }

  return ProductionLog.findAll({
    where,
    include: [
      { model: Dish, as: 'dish' },
      { model: Admin, as: 'chief', attributes: ['id', 'name', 'short_id'] },
    ],
    order: [['logged_at', 'DESC']],
  });
}

async function listTodayPlatesOverview(dateInput) {
  const { start, end, date } = getDateRange(dateInput);

  const [productionLogs, sales] = await Promise.all([
    ProductionLog.findAll({
      where: { logged_at: { [Op.between]: [start, end] } },
      attributes: ['dish_id'],
      group: ['dish_id'],
      raw: true,
    }),
    Sale.findAll({
      where: { sold_at: { [Op.between]: [start, end] } },
      attributes: ['dish_id'],
      group: ['dish_id'],
      raw: true,
    }),
  ]);

  const dishIds = new Set([
    ...productionLogs.map((l) => l.dish_id),
    ...sales.map((s) => s.dish_id).filter((id) => id != null),
  ]);

  const plates = [];
  for (const dishId of dishIds) {
    const stock = await getPlateAvailabilityForDate(dishId, date);
    const dish = await Dish.findByPk(dishId, { attributes: ['id', 'name'] });

    plates.push({
      dish_id: dishId,
      dish_name: dish?.name ?? stock.dish_name ?? `Plate #${dishId}`,
      date,
      produced_kg: stock.produced_kg,
      produced_plates: stock.produced_plates,
      sold_kg: stock.sold_kg,
      remaining_kg: stock.remaining_kg,
    });
  }

  plates.sort((a, b) => {
    const nameA = a.dish_name ?? '';
    const nameB = b.dish_name ?? '';
    return nameA.localeCompare(nameB);
  });

  const pool = await getTodayTotalPlatePool(date);

  return { date, plates, summary: pool };
}

function normalizeDateKey(day) {
  if (!day) return null;
  if (day instanceof Date) return formatDateYmd(day);
  return String(day).slice(0, 10);
}

async function listAllPlatesOverview() {
  const [prodDates, saleDates] = await Promise.all([
    ProductionLog.findAll({
      attributes: [[sequelize.fn('DATE', sequelize.col('logged_at')), 'day']],
      group: ['day'],
      raw: true,
    }),
    Sale.findAll({
      attributes: [[sequelize.fn('DATE', sequelize.col('sold_at')), 'day']],
      group: ['day'],
      raw: true,
    }),
  ]);

  const dateSet = new Set();
  for (const row of [...prodDates, ...saleDates]) {
    const date = normalizeDateKey(row.day);
    if (date) dateSet.add(date);
  }

  const dates = [...dateSet].sort((a, b) => b.localeCompare(a));

  const plates = [];
  const summary = { produced_kg: 0, sold_kg: 0, remaining_kg: 0, available_kg: 0 };
  for (const date of dates) {
    const { plates: dayPlates } = await listTodayPlatesOverview(date);
    plates.push(...dayPlates);
    const pool = await getTodayTotalPlatePool(date);
    summary.produced_kg += pool.produced_kg;
    summary.sold_kg += pool.sold_kg;
    summary.remaining_kg += pool.remaining_kg;
    summary.available_kg += pool.available_kg;
  }

  return { plates, summary };
}

module.exports = {
  listStock,
  adjustStock,
  resolveProductionChiefId,
  logProduction,
  listProductionLogs,
  getPlateAvailabilityForDate,
  getTodayPlateAvailability,
  getTodayTotalPlatePool,
  listTodayPlatesOverview,
  listAllPlatesOverview,
};
