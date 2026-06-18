const {
  sequelize,
  Ingredient,
  ProductionLog,
  Dish,
  DishIngredient,
  StockMovement,
  Admin,
} = require('../models');
const AppError = require('../utils/AppError');

async function listStock() {
  return Ingredient.findAll({
    order: [['name', 'ASC']],
  });
}

async function adjustStock(ingredientId, { quantity_delta, notes }, userId) {
  const transaction = await sequelize.transaction();

  try {
    const ingredient = await Ingredient.findByPk(ingredientId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    if (!ingredient) throw new AppError('Ingredient not found', 404);

    const delta = parseFloat(quantity_delta);
    const newStock = parseFloat(ingredient.current_stock) + delta;
    if (newStock < 0) {
      throw new AppError('Stock cannot go below zero', 400);
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

async function logProduction(chiefId, { dish_id, plates_count, notes }) {
  const transaction = await sequelize.transaction();

  try {
    const dish = await Dish.findByPk(dish_id, {
      include: [{ model: DishIngredient, as: 'recipe' }],
      transaction,
    });
    if (!dish) throw new AppError('Dish not found', 404);

    const recipe = dish.recipe || [];
    if (recipe.length === 0) {
      throw new AppError('Dish has no recipe defined', 400);
    }

    for (const item of recipe) {
      const ingredient = await Ingredient.findByPk(item.ingredient_id, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });
      const used = parseFloat(item.quantity_per_plate) * plates_count;
      const newStock = parseFloat(ingredient.current_stock) - used;

      if (newStock < 0) {
        throw new AppError(
          `Insufficient stock for ${ingredient.name}. Need ${used}, have ${ingredient.current_stock}`,
          400
        );
      }

      await ingredient.update({ current_stock: newStock }, { transaction });

      await StockMovement.create(
        {
          ingredient_id: item.ingredient_id,
          type: 'production',
          quantity_delta: -used,
          reference_id: dish_id,
          notes: `Production: ${plates_count} plates of ${dish.name}`,
          created_by: chiefId,
        },
        { transaction }
      );
    }

    const log = await ProductionLog.create(
      {
        dish_id,
        plates_count,
        chief_id: chiefId,
        notes: notes || null,
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

async function listProductionLogs() {
  return ProductionLog.findAll({
    include: [
      { model: Dish, as: 'dish' },
      { model: Admin, as: 'chief', attributes: ['id', 'name', 'short_id'] },
    ],
    order: [['logged_at', 'DESC']],
  });
}

module.exports = {
  listStock,
  adjustStock,
  logProduction,
  listProductionLogs,
};
