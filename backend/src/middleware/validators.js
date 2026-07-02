const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { PAYMENT_METHODS } = require('../constants/paymentMethods');

const PLATE_WEIGHT_TYPES = ['quarter', 'half', 'kilo', 'slice', 'half_slice'];

function validateSaleItems(items) {
  if (!Array.isArray(items)) return true;
  for (const item of items) {
    const saleType = item.sale_type || 'plate';
    if (saleType === 'coffee' || saleType === 'water') {
      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1) {
        throw new Error('VALIDATION_QUANTITY_POSITIVE');
      }
      if (saleType === 'water' && item.water_bottle_size != null) {
        if (!['small', 'large'].includes(item.water_bottle_size)) {
          throw new Error('VALIDATION_FAILED');
        }
      }
      continue;
    }
    if (!PLATE_WEIGHT_TYPES.includes(item.weight_type)) {
      throw new Error('VALIDATION_INVALID_WEIGHT_TYPE');
    }
  }
  return true;
}

function tipNotAllowedForCash() {
  return body('tip_amount').custom((value, { req }) => {
    const tip = parseFloat(value);
    const paymentMethod = req.body.payment_method || 'cash';
    if (paymentMethod === 'cash' && !Number.isNaN(tip) && tip > 0) {
      throw new Error('VALIDATION_TIP_NOT_ALLOWED_FOR_CASH');
    }
    return true;
  });
}

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
  body('price_half_slice').optional({ nullable: true }).isFloat({ min: 0 }),
  validate,
];

const createSaleValidation = [
  body('sale_type').optional().isIn(['plate', 'coffee', 'water']).withMessage('VALIDATION_FAILED'),
  body('dish_id')
    .optional({ values: 'falsy' })
    .isInt({ gt: 0 })
    .withMessage('VALIDATION_DISH_INVALID'),
  body('weight_type')
    .if((value, { req }) => !['coffee', 'water'].includes(req.body.sale_type || 'plate'))
    .isIn(PLATE_WEIGHT_TYPES)
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
  body('tip_amount').optional().isFloat({ min: 0 }).withMessage('VALIDATION_FAILED'),
  tipNotAllowedForCash(),
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
  body('items').custom(validateSaleItems),
  body('items.*.sale_type').optional().isIn(['plate', 'coffee', 'water']).withMessage('VALIDATION_FAILED'),
  body('items.*.dish_id')
    .optional({ values: 'falsy' })
    .isInt({ gt: 0 })
    .withMessage('VALIDATION_DISH_INVALID'),
  body('items.*.quantity').optional().isInt({ gt: 0 }).withMessage('VALIDATION_QUANTITY_POSITIVE'),
  body('items.*.kilo_consumed')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('VALIDATION_QUANTITY_POSITIVE'),
  body('tip_amount').optional().isFloat({ min: 0 }).withMessage('VALIDATION_FAILED'),
  tipNotAllowedForCash(),
  validate,
];

const stockAdjustValidation = [
  body('ingredient_id').isInt().withMessage('VALIDATION_INGREDIENT_REQUIRED'),
  body('quantity_delta').isFloat().withMessage('VALIDATION_QUANTITY_DELTA_REQUIRED'),
  validate,
];

const updateSaleValidation = [
  body('weight_type')
    .optional()
    .isIn(['quarter', 'half', 'kilo', 'slice', 'half_slice'])
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
  body('tip_amount').optional().isFloat({ min: 0 }).withMessage('VALIDATION_FAILED'),
  tipNotAllowedForCash(),
  body().custom((value) => {
    const keys = [
      'weight_type',
      'payment_method',
      'quantity',
      'slice_count',
      'kilo_consumed',
      'seller_id',
      'tip_amount',
    ];
    if (!keys.some((key) => value[key] !== undefined)) {
      throw new Error('VALIDATION_FAILED');
    }
    return true;
  }),
  validate,
];

const updateCoffeeSettingsValidation = [
  body('ingredient_id').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('VALIDATION_INGREDIENT_REQUIRED'),
  body('price_per_cup').optional({ nullable: true }).isFloat({ min: 0 }),
  body('cups_per_kg').optional().isFloat({ gt: 0 }).withMessage('VALIDATION_QUANTITY_POSITIVE'),
  body('is_active').optional().isBoolean().withMessage('VALIDATION_FAILED'),
  validate,
];

const updateWaterSettingsValidation = [
  body('price_per_bottle').optional({ nullable: true }).isFloat({ min: 0 }),
  body('price_large_bottle').optional({ nullable: true }).isFloat({ min: 0 }),
  body('min_stock_bottles').optional().isFloat({ min: 0 }),
  body('is_active').optional().isBoolean().withMessage('VALIDATION_FAILED'),
  validate,
];

const waterStockAdjustValidation = [
  body('bottle_size').isIn(['small', 'large']).withMessage('VALIDATION_FAILED'),
  body('quantity_delta').isFloat().withMessage('VALIDATION_QUANTITY_DELTA_REQUIRED').custom((value) => {
    const delta = parseFloat(value);
    if (delta === 0 || Number.isNaN(delta)) {
      throw new Error('VALIDATION_QUANTITY_DELTA_REQUIRED');
    }
    return true;
  }),
  body('notes').optional().isString(),
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
  updateSaleValidation,
  productionValidation,
  stockAdjustValidation,
  createTransferValidation,
  createChiefExpenseValidation,
  updateCoffeeSettingsValidation,
  updateWaterSettingsValidation,
  waterStockAdjustValidation,
};
