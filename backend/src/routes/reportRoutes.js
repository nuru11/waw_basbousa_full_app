const express = require('express');
const reportController = require('../controllers/reportController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, requireRole('superAdmin'));

router.get('/summary', reportController.summary);
router.get('/purchases', reportController.purchases);
router.get('/sales', reportController.sales);
router.get('/sales/daily', reportController.dailySales);
router.get('/stock-movements', reportController.stockMovements);

module.exports = router;
