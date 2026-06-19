const { body } = require('express-validator');
const validate = require('../middleware/validate');

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const createAdminValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['superAdmin', 'purchaser', 'chief', 'employee'])
    .withMessage('Invalid role'),
  validate,
];

const createIngredientValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('unit')
    .optional()
    .isIn(['bottle', 'kg', 'piece', 'liter', 'gram'])
    .withMessage('Invalid unit'),
  validate,
];

const createTransferValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be positive'),
  body('purchaser_id').isInt().withMessage('Purchaser is required'),
  validate,
];

const createPurchaseValidation = [
  body('ingredient_id').isInt().withMessage('Ingredient is required'),
  body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be positive'),
  body('unit_price').isFloat({ gt: 0 }).withMessage('Unit price must be positive'),
  validate,
];

const createDishValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  validate,
];

const createSaleValidation = [
  body('dish_id').isInt().withMessage('Dish is required'),
  body('weight_type')
    .isIn(['quarter', 'half', 'kilo', 'slice'])
    .withMessage('Invalid weight type'),
  body('payment_method')
    .optional()
    .isIn(['cash', 'cbe', 'telebirr', 'other'])
    .withMessage('Invalid payment method'),
  body('quantity').optional().isInt({ gt: 0 }).withMessage('Quantity must be positive'),
  body('slice_count')
    .if((value, { req }) => req.body.weight_type === 'slice')
    .isInt({ gt: 0 })
    .withMessage('Slice count is required for slice sales'),
  body('seller_id').optional().isInt().withMessage('Invalid seller'),
  validate,
];

const productionValidation = [
  body('dish_id').isInt().withMessage('Dish is required'),
  body('plates_count').isInt({ gt: 0 }).withMessage('Plates count must be positive'),
  body('plate_weight_grams').isFloat({ gt: 0 }).withMessage('Plate weight is required'),
  validate,
];

const stockAdjustValidation = [
  body('ingredient_id').isInt().withMessage('Ingredient is required'),
  body('quantity_delta').isFloat().withMessage('Quantity delta is required'),
  validate,
];

module.exports = {
  loginValidation,
  createAdminValidation,
  createIngredientValidation,
  createPurchaseValidation,
  createDishValidation,
  createSaleValidation,
  productionValidation,
  stockAdjustValidation,
  createTransferValidation,
};
