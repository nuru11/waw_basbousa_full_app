const ingredientService = require('../services/ingredientService');

async function list(req, res, next) {
  try {
    const ingredients = await ingredientService.listIngredients();
    res.json({ success: true, data: ingredients });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const ingredient = await ingredientService.getIngredient(req.params.id);
    res.json({ success: true, data: ingredient });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const ingredient = await ingredientService.createIngredient(req.body);
    res.status(201).json({ success: true, data: ingredient });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const ingredient = await ingredientService.updateIngredient(req.params.id, req.body);
    res.json({ success: true, data: ingredient });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await ingredientService.deleteIngredient(req.params.id);
    res.json({ success: true, message: 'Ingredient deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
