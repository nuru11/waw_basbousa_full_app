const express = require('express');
const authController = require('../controllers/authController');
const { loginValidation } = require('../middleware/validators');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', loginValidation, authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
