const dishService = require('../services/dishService');
const posDefaultPriceService = require('../services/posDefaultPriceService');
const { redactDish, redactDishes } = require('../utils/financialRedaction');

async function list(req, res, next) {
  try {
    const activeOnly = req.query.active === 'true';
    const dishes = await dishService.listDishes({ activeOnly });
    const data = req.user.role === 'chief' ? redactDishes(dishes) : dishes;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const dish = await dishService.getDish(req.params.id);
    const data = req.user.role === 'chief' ? redactDish(dish) : dish;
    res.json({ success: true, data });
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

async function getPosDefaultPrices(req, res, next) {
  try {
    const data =
      req.query.effective === 'true'
        ? await posDefaultPriceService.getEffectivePricesForCashier()
        : await posDefaultPriceService.getDefaultPrices();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updatePosDefaultPrices(req, res, next) {
  try {
    const data = await posDefaultPriceService.updateDefaultPrices(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  updateRecipe,
  remove,
  getPosDefaultPrices,
  updatePosDefaultPrices,
};
