const express = require('express');
const salaryController = require('../controllers/salaryController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, requireRole('superAdmin'));

router.get('/', salaryController.list);
router.put('/employees/:id/salary', salaryController.setSalary);
router.post('/employees/:id/pay', salaryController.pay);

module.exports = router;
