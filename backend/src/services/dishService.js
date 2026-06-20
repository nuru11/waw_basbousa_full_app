const {
  sequelize,
  Dish,
  DishIngredient,
  Ingredient,
} = require('../models');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

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
      await DishIngredient.bulkCreate(
        recipe.map((r) => ({
          dish_id: dish.id,
          ingredient_id: r.ingredient_id,
          quantity_per_plate: r.quantity_per_plate,
        })),
        { transaction }
      );
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
        await DishIngredient.bulkCreate(
          recipe.map((r) => ({
            dish_id: id,
            ingredient_id: r.ingredient_id,
            quantity_per_plate: r.quantity_per_plate,
          })),
          { transaction }
        );
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
  const dish = await getDish(id);
  const transaction = await sequelize.transaction();

  try {
    if (recipe !== undefined) {
      await DishIngredient.destroy({ where: { dish_id: id }, transaction });
      if (recipe.length > 0) {
        await DishIngredient.bulkCreate(
          recipe.map((r) => ({
            dish_id: id,
            ingredient_id: r.ingredient_id,
            quantity_per_plate: r.quantity_per_plate,
          })),
          { transaction }
        );
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
