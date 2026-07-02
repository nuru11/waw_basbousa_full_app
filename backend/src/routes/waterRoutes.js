const express = require('express');
const waterController = require('../controllers/waterController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { updateWaterSettingsValidation, waterStockAdjustValidation } = require('../middleware/validators');

const router = express.Router();

router.get(
  '/settings',
  authMiddleware,
  requireRole('superAdmin', 'employee', 'chief'),
  waterController.getSettings
);

router.put(
  '/settings',
  authMiddleware,
  requireRole('superAdmin'),
  updateWaterSettingsValidation,
  waterController.updateSettings
);

router.post(
  '/stock/adjust',
  authMiddleware,
  requireRole('superAdmin'),
  waterStockAdjustValidation,
  waterController.adjustStock
);

module.exports = router;
