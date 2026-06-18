const express = require('express');
const saleController = require('../controllers/saleController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createSaleValidation } = require('../middleware/validators');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  requireRole('employee'),
  createSaleValidation,
  saleController.create
);

router.get('/mine', requireRole('employee'), saleController.mine);

router.get('/', requireRole('superAdmin'), saleController.list);

module.exports = router;
