const express = require('express');
const saleController = require('../controllers/saleController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createSaleValidation } = require('../middleware/validators');

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/sellers',
  requireRole('employee', 'chief'),
  saleController.sellers
);

router.post(
  '/',
  requireRole('employee', 'chief'),
  createSaleValidation,
  saleController.create
);

router.get('/mine', requireRole('employee', 'chief'), saleController.mine);

router.get('/', requireRole('superAdmin'), saleController.list);

module.exports = router;
