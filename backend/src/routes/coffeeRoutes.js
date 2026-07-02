const express = require('express');
const coffeeController = require('../controllers/coffeeController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { updateCoffeeSettingsValidation } = require('../middleware/validators');

const router = express.Router();

router.get(
  '/settings',
  authMiddleware,
  requireRole('superAdmin', 'employee', 'chief'),
  coffeeController.getSettings
);

router.put(
  '/settings',
  authMiddleware,
  requireRole('superAdmin'),
  updateCoffeeSettingsValidation,
  coffeeController.updateSettings
);

module.exports = router;
