const express = require('express');
const authController = require('../controllers/authController');
const { loginValidation } = require('../middleware/validators');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/login', loginValidation, authController.login);
router.get('/me', authMiddleware, authController.me);
router.get(
  '/chiefs',
  authMiddleware,
  requireRole('employee', 'chief', 'superAdmin'),
  authController.listChiefs
);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
