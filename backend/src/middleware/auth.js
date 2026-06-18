const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { Admin } = require('../models');
const AppError = require('../utils/AppError');

async function authMiddleware(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);

    const admin = await Admin.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!admin) {
      throw new AppError('User not found', 401);
    }

    req.user = admin;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(err);
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403));
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
