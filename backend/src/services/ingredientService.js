const { Ingredient } = require('../models');
const AppError = require('../utils/AppError');

async function listIngredients() {
  return Ingredient.findAll({ order: [['name', 'ASC']] });
}

async function getIngredient(id) {
  const ingredient = await Ingredient.findByPk(id);
  if (!ingredient) throw new AppError('Ingredient not found', 404);
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
  await ingredient.destroy();
}

module.exports = {
  listIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
};
