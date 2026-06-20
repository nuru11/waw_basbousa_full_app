const express = require('express');
const stockController = require('../controllers/stockController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { productionValidation, stockAdjustValidation } = require('../middleware/validators');

const router = express.Router();

router.use(authMiddleware);

router.get('/', requireRole('superAdmin', 'chief'), stockController.list);

router.post(
  '/adjust',
  requireRole('superAdmin', 'chief'),
  stockAdjustValidation,
  stockController.adjust
);

router.post(
  '/production',
  requireRole('chief'),
  productionValidation,
  stockController.logProduction
);

router.get(
  '/production',
  requireRole('superAdmin', 'chief'),
  stockController.listProduction
);

router.get(
  '/plate-availability/today',
  requireRole('employee', 'chief'),
  stockController.plateAvailabilityToday
);

router.get(
  '/plates/today',
  requireRole('chief', 'superAdmin'),
  stockController.listTodayPlates
);

router.get(
  '/plates/history',
  requireRole('superAdmin'),
  stockController.listPlatesHistory
);

module.exports = router;
