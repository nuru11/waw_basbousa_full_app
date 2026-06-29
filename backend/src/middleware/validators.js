const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { PAYMENT_METHODS } = require('../constants/paymentMethods');

const loginValidation = [
  body('username').trim().notEmpty().withMessage('VALIDATION_USERNAME_REQUIRED'),
  body('password').notEmpty().withMessage('VALIDATION_PASSWORD_REQUIRED'),
  validate,
];

const createAdminValidation = [
  body('name').trim().notEmpty().withMessage('VALIDATION_NAME_REQUIRED'),
  body('username').trim().notEmpty().withMessage('VALIDATION_USERNAME_REQUIRED'),
  body('password').isLength({ min: 6 }).withMessage('VALIDATION_PASSWORD_MIN'),
  body('role')
    .isIn(['superAdmin', 'purchaser', 'chief', 'employee'])
    .withMessage('VALIDATION_INVALID_ROLE'),
  validate,
];

const createIngredientValidation = [
  body('name').trim().notEmpty().withMessage('VALIDATION_NAME_REQUIRED'),
  body('unit')
    .optional()
    .isIn(['bottle', 'kg', 'piece', 'liter', 'gram'])
    .withMessage('VALIDATION_INVALID_UNIT'),
  body('has_size').optional().isBoolean().withMessage('VALIDATION_FAILED'),
  body('auto_reduce').optional().isBoolean().withMessage('VALIDATION_FAILED'),
  validate,
];

const createTransferValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('VALIDATION_AMOUNT_POSITIVE'),
  body('purchaser_id').isInt().withMessage('VALIDATION_PURCHASER_REQUIRED'),
  validate,
];

const createChiefExpenseValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('VALIDATION_AMOUNT_POSITIVE'),
  body('chief_id').isInt().withMessage('VALIDATION_CHIEF_REQUIRED'),
  body('category')
    .isIn(['food', 'hotel', 'other'])
    .withMessage('VALIDATION_INVALID_CHIEF_EXPENSE_CATEGORY'),
  body('spent_at').isISO8601().withMessage('VALIDATION_SPENT_AT_REQUIRED'),
  validate,
];

const createPurchaseValidation = [
  body('ingredient_id').isInt().withMessage('VALIDATION_INGREDIENT_REQUIRED'),
  body('quantity').isFloat({ gt: 0 }).withMessage('VALIDATION_QUANTITY_POSITIVE'),
  body('unit_price').isFloat({ gt: 0 }).withMessage('VALIDATION_UNIT_PRICE_POSITIVE'),
  body('size')
    .optional()
    .isIn(['small', 'large'])
    .withMessage('VALIDATION_INVALID_SIZE'),
  validate,
];

const createDishValidation = [
  body('name').trim().notEmpty().withMessage('VALIDATION_NAME_REQUIRED'),
  validate,
];

const updatePosDefaultPricesValidation = [
  body('price_quarter').optional({ nullable: true }).isFloat({ min: 0 }),
  body('price_half').optional({ nullable: true }).isFloat({ min: 0 }),
  body('price_kilo').optional({ nullable: true }).isFloat({ min: 0 }),
  body('price_per_slice').optional({ nullable: true }).isFloat({ min: 0 }),
  validate,
];

const createSaleValidation = [
  body('dish_id')
    .optional({ values: 'falsy' })
    .isInt({ gt: 0 })
    .withMessage('VALIDATION_DISH_INVALID'),
  body('weight_type')
    .isIn(['quarter', 'half', 'kilo', 'slice'])
    .withMessage('VALIDATION_INVALID_WEIGHT_TYPE'),
  body('payment_method')
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage('VALIDATION_INVALID_PAYMENT'),
  body('quantity').optional().isInt({ gt: 0 }).withMessage('VALIDATION_QUANTITY_POSITIVE'),
  body('slice_count')
    .if((value, { req }) => req.body.weight_type === 'slice')
    .isInt({ gt: 0 })
    .withMessage('VALIDATION_SLICE_COUNT_REQUIRED'),
  body('kilo_consumed').optional().isFloat({ gt: 0 }).withMessage('VALIDATION_QUANTITY_POSITIVE'),
  body('seller_id').optional().isInt().withMessage('VALIDATION_INVALID_SELLER'),
  validate,
];

const productionValidation = [
  body('dish_id').isInt().withMessage('VALIDATION_DISH_REQUIRED'),
  body('plates_count').isInt({ gt: 0 }).withMessage('VALIDATION_PLATES_POSITIVE'),
  body('plate_weight_grams').isFloat({ gt: 0 }).withMessage('VALIDATION_PLATE_WEIGHT_REQUIRED'),
  body('ingredient_usage').optional().isArray({ min: 1 }),
  body('ingredient_usage.*.ingredient_id').isInt(),
  body('ingredient_usage.*.quantity_used').isFloat({ gt: 0 }),
  body('ingredient_usage.*.size')
    .optional({ nullable: true })
    .isIn(['small', 'large'])
    .withMessage('VALIDATION_INVALID_SIZE'),
  validate,
];

const createSalesBatchValidation = [
  body('payment_method')
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage('VALIDATION_INVALID_PAYMENT'),
  body('seller_id').optional().isInt().withMessage('VALIDATION_INVALID_SELLER'),
  body('items').isArray({ min: 1 }).withMessage('VALIDATION_ITEMS_REQUIRED'),
  body('items.*.dish_id')
    .optional({ values: 'falsy' })
    .isInt({ gt: 0 })
    .withMessage('VALIDATION_DISH_INVALID'),
  body('items.*.weight_type')
    .isIn(['quarter', 'half', 'kilo', 'slice'])
    .withMessage('VALIDATION_INVALID_WEIGHT_TYPE'),
  body('items.*.quantity').optional().isInt({ gt: 0 }).withMessage('VALIDATION_QUANTITY_POSITIVE'),
  body('items.*.kilo_consumed')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('VALIDATION_QUANTITY_POSITIVE'),
  validate,
];

const stockAdjustValidation = [
  body('ingredient_id').isInt().withMessage('VALIDATION_INGREDIENT_REQUIRED'),
  body('quantity_delta').isFloat().withMessage('VALIDATION_QUANTITY_DELTA_REQUIRED'),
  validate,
];

module.exports = {
  loginValidation,
  createAdminValidation,
  createIngredientValidation,
  createPurchaseValidation,
  createDishValidation,
  updatePosDefaultPricesValidation,
  createSaleValidation,
  createSalesBatchValidation,
  productionValidation,
  stockAdjustValidation,
  createTransferValidation,
  createChiefExpenseValidation,
};
