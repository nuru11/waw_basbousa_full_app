const express = require('express');
const expenseController = require('../controllers/expenseController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { handleOptionalReceiptUpload } = require('../middleware/upload');

const router = express.Router();

router.use(authMiddleware, requireRole('superAdmin'));

router.get('/summary', expenseController.summary);
router.get('/', expenseController.list);
router.post('/', handleOptionalReceiptUpload, expenseController.create);
router.delete('/:id', expenseController.remove);
router.get('/:id/receipt', expenseController.receipt);

module.exports = router;
