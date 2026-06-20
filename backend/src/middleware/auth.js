const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { Admin } = require('../models');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

async function authMiddleware(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('AUTH_REQUIRED', ERROR_CODES.AUTH_REQUIRED, 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);

    const admin = await Admin.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!admin) {
      throw new AppError('USER_NOT_FOUND', ERROR_CODES.USER_NOT_FOUND, 401);
    }

    if (admin.status !== 'active') {
      throw new AppError('ACCOUNT_INACTIVE', ERROR_CODES.ACCOUNT_INACTIVE, 403);
    }

    req.user = admin;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('INVALID_TOKEN', ERROR_CODES.INVALID_TOKEN, 401));
    }
    next(err);
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN', ERROR_CODES.FORBIDDEN, 403));
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
