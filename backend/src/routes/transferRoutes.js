const express = require('express');
const transferController = require('../controllers/transferController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createTransferValidation } = require('../middleware/validators');

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/balance',
  requireRole('purchaser'),
  transferController.balance
);

router.get(
  '/summary',
  requireRole('superAdmin'),
  transferController.summary
);

router.get(
  '/',
  requireRole('superAdmin', 'purchaser'),
  transferController.list
);

router.post(
  '/',
  requireRole('superAdmin'),
  createTransferValidation,
  transferController.create
);

router.post(
  '/:id/accept',
  requireRole('purchaser'),
  transferController.accept
);

module.exports = router;
