const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createAdminValidation } = require('../middleware/validators');

const router = express.Router();

router.use(authMiddleware, requireRole('superAdmin'));

router.get('/', adminController.list);
router.get('/:id', adminController.getOne);
router.post('/', createAdminValidation, adminController.create);
router.put('/:id', adminController.update);
router.delete('/:id', adminController.remove);

module.exports = router;
