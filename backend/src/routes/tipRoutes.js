const express = require('express');
const tipController = require('../controllers/tipController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, requireRole('superAdmin'));

router.get('/', tipController.list);
router.post('/sellers/:id/pay', tipController.pay);

module.exports = router;
