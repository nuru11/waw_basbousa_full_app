const dishService = require('../services/dishService');

async function list(req, res, next) {
  try {
    const activeOnly = req.query.active === 'true';
    const dishes = await dishService.listDishes({ activeOnly });
    res.json({ success: true, data: dishes });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const dish = await dishService.getDish(req.params.id);
    res.json({ success: true, data: dish });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const dish = await dishService.createDish(req.body);
    res.status(201).json({ success: true, data: dish });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const dish = await dishService.updateDish(req.params.id, req.body);
    res.json({ success: true, data: dish });
  } catch (err) {
    next(err);
  }
}

async function updateRecipe(req, res, next) {
  try {
    const dish = await dishService.updateRecipe(req.params.id, req.body);
    res.json({ success: true, data: dish });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await dishService.deleteDish(req.params.id);
    res.json({ success: true, message: 'Dish deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, updateRecipe, remove };
