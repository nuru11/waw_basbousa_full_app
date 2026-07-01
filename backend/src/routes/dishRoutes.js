const express = require('express');
const dishController = require('../controllers/dishController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createDishValidation, updatePosDefaultPricesValidation } = require('../middleware/validators');

const router = express.Router();

router.get(
  '/pos-default-prices',
  authMiddleware,
  requireRole('superAdmin', 'chief', 'employee'),
  dishController.getPosDefaultPrices
);

router.put(
  '/pos-default-prices',
  authMiddleware,
  requireRole('superAdmin', 'chief'),
  updatePosDefaultPricesValidation,
  dishController.updatePosDefaultPrices
);

router.get(
  '/',
  authMiddleware,
  requireRole('superAdmin', 'chief', 'employee'),
  dishController.list
);

router.get(
  '/:id',
  authMiddleware,
  requireRole('superAdmin', 'chief'),
  dishController.getOne
);

router.put(
  '/:id/recipe',
  authMiddleware,
  requireRole('superAdmin', 'chief'),
  dishController.updateRecipe
);

router.post(
  '/',
  authMiddleware,
  requireRole('superAdmin', 'chief'),
  createDishValidation,
  dishController.create
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('superAdmin', 'chief'),
  dishController.update
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('superAdmin', 'chief'),
  dishController.remove
);

module.exports = router;
