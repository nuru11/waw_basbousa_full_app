const express = require('express');
const chiefExpenseController = require('../controllers/chiefExpenseController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createChiefExpenseValidation } = require('../middleware/validators');

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/summary',
  requireRole('superAdmin'),
  chiefExpenseController.summary
);

router.get(
  '/',
  requireRole('superAdmin', 'chief'),
  chiefExpenseController.list
);

router.post(
  '/',
  requireRole('superAdmin'),
  createChiefExpenseValidation,
  chiefExpenseController.create
);

router.delete(
  '/:id',
  requireRole('superAdmin'),
  chiefExpenseController.remove
);

module.exports = router;
