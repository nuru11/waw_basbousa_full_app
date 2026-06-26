const express = require('express');
const purchaseController = require('../controllers/purchaseController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/',
  requireRole('superAdmin', 'purchaser', 'chief'),
  purchaseController.list
);

router.get(
  '/inventory',
  requireRole('purchaser'),
  purchaseController.inventory
);

router.post(
  '/',
  requireRole('purchaser'),
  handleUpload,
  purchaseController.create
);

router.get(
  '/:id/screenshot',
  requireRole('superAdmin', 'purchaser'),
  purchaseController.screenshot
);

router.post(
  '/:id/hand-to-chief',
  requireRole('purchaser'),
  purchaseController.handToChief
);

router.post(
  '/:id/receive',
  requireRole('chief'),
  purchaseController.receive
);

module.exports = router;
