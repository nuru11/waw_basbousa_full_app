const express = require('express');
const ingredientController = require('../controllers/ingredientController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createIngredientValidation } = require('../middleware/validators');

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  requireRole('superAdmin', 'purchaser', 'chief'),
  ingredientController.list
);

router.use(authMiddleware, requireRole('superAdmin'));

router.get('/:id', ingredientController.getOne);
router.post('/', createIngredientValidation, ingredientController.create);
router.put('/:id', ingredientController.update);
router.delete('/:id', ingredientController.remove);

module.exports = router;
