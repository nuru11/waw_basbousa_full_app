const express = require('express');
const dishController = require('../controllers/dishController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createDishValidation } = require('../middleware/validators');

const router = express.Router();

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
  requireRole('superAdmin'),
  dishController.updateRecipe
);

router.post(
  '/',
  authMiddleware,
  requireRole('superAdmin'),
  createDishValidation,
  dishController.create
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('superAdmin'),
  dishController.update
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('superAdmin'),
  dishController.remove
);

module.exports = router;
