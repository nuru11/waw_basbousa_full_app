const { Ingredient } = require('../models');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const coffeeService = require('./coffeeService');

async function listIngredients() {
  return Ingredient.findAll({ order: [['name', 'ASC']] });
}

async function getIngredient(id) {
  const ingredient = await Ingredient.findByPk(id);
  if (!ingredient) throw new AppError('INGREDIENT_NOT_FOUND', ERROR_CODES.INGREDIENT_NOT_FOUND, 404);
  return ingredient;
}

async function createIngredient(data) {
  return Ingredient.create(data);
}

async function updateIngredient(id, data) {
  const ingredient = await getIngredient(id);
  await ingredient.update(data);
  return ingredient;
}

async function deleteIngredient(id) {
  const ingredient = await getIngredient(id);
  if (await coffeeService.isIngredientLinked(id)) {
    throw new AppError(
      'INGREDIENT_LINKED_TO_COFFEE',
      ERROR_CODES.INGREDIENT_LINKED_TO_COFFEE,
      400
    );
  }
  await ingredient.destroy();
}

module.exports = {
  listIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
};
