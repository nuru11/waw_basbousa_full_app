const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    const code = first.msg;
    const message = ERROR_CODES[code] || ERROR_CODES.VALIDATION_FAILED;
    return next(new AppError(code, message, 422));
  }
  next();
}

module.exports = validate;
