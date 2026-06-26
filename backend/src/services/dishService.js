const {
  sequelize,
  Dish,
  DishIngredient,
  Ingredient,
} = require('../models');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const VALID_SIZES = ['small', 'large'];

async function normalizeRecipeItems(recipe, transaction) {
  if (!recipe || recipe.length === 0) return [];

  const ingredientIds = [...new Set(recipe.map((r) => r.ingredient_id))];
  const ingredients = await Ingredient.findAll({
    where: { id: ingredientIds },
    transaction,
  });
  const byId = new Map(ingredients.map((i) => [i.id, i]));

  const normalized = [];

  for (const item of recipe) {
    const ingredient = byId.get(item.ingredient_id);
    if (!ingredient) {
      throw new AppError('INGREDIENT_NOT_FOUND', ERROR_CODES.INGREDIENT_NOT_FOUND, 404);
    }

    const qty = parseFloat(item.quantity_per_plate);
    if (!qty || qty <= 0) continue;

    const size = item.size ?? null;

    if (ingredient.has_size) {
      if (!size || !VALID_SIZES.includes(size)) {
        throw new AppError('RECIPE_SIZE_REQUIRED', ERROR_CODES.RECIPE_SIZE_REQUIRED, 400);
      }
    } else if (size) {
      throw new AppError('RECIPE_SIZE_NOT_ALLOWED', ERROR_CODES.RECIPE_SIZE_NOT_ALLOWED, 400);
    }

    normalized.push({
      ingredient_id: item.ingredient_id,
      quantity_per_plate: qty,
      size: ingredient.has_size ? size : null,
    });
  }

  return normalized;
}

function mapRecipeForCreate(dishId, recipe) {
  return recipe.map((r) => ({
    dish_id: dishId,
    ingredient_id: r.ingredient_id,
    quantity_per_plate: r.quantity_per_plate,
    size: r.size ?? null,
  }));
}

async function listDishes({ activeOnly = false } = {}) {
  const where = activeOnly ? { is_active: true } : {};
  return Dish.findAll({
    where,
    include: [
      {
        model: DishIngredient,
        as: 'recipe',
        include: [{ model: Ingredient, as: 'ingredient' }],
      },
    ],
    order: [['name', 'ASC']],
  });
}

async function getDish(id) {
  const dish = await Dish.findByPk(id, {
    include: [
      {
        model: DishIngredient,
        as: 'recipe',
        include: [{ model: Ingredient, as: 'ingredient' }],
      },
    ],
  });
  if (!dish) throw new AppError('DISH_NOT_FOUND', ERROR_CODES.DISH_NOT_FOUND, 404);
  return dish;
}

async function createDish(data) {
  const { recipe, ...dishData } = data;
  const transaction = await sequelize.transaction();

  try {
    const dish = await Dish.create(dishData, { transaction });

    if (recipe && recipe.length > 0) {
      const normalized = await normalizeRecipeItems(recipe, transaction);
      if (normalized.length > 0) {
        await DishIngredient.bulkCreate(mapRecipeForCreate(dish.id, normalized), { transaction });
      }
    }

    await transaction.commit();
    return getDish(dish.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function updateDish(id, data) {
  const dish = await getDish(id);
  const { recipe, ...dishData } = data;

  const transaction = await sequelize.transaction();
  try {
    await dish.update(dishData, { transaction });

    if (recipe !== undefined) {
      await DishIngredient.destroy({ where: { dish_id: id }, transaction });
      if (recipe.length > 0) {
        const normalized = await normalizeRecipeItems(recipe, transaction);
        if (normalized.length > 0) {
          await DishIngredient.bulkCreate(mapRecipeForCreate(id, normalized), { transaction });
        }
      }
    }

    await transaction.commit();
    return getDish(id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function updateRecipe(id, { recipe }) {
  await getDish(id);
  const transaction = await sequelize.transaction();

  try {
    if (recipe !== undefined) {
      await DishIngredient.destroy({ where: { dish_id: id }, transaction });
      if (recipe.length > 0) {
        const normalized = await normalizeRecipeItems(recipe, transaction);
        if (normalized.length > 0) {
          await DishIngredient.bulkCreate(mapRecipeForCreate(id, normalized), { transaction });
        }
      }
    }

    await transaction.commit();
    return getDish(id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deleteDish(id) {
  const dish = await getDish(id);
  await dish.destroy();
}

module.exports = {
  listDishes,
  getDish,
  createDish,
  updateDish,
  updateRecipe,
  deleteDish,
};
