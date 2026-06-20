const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const jwtConfig = require('../config/jwt');
const { comparePassword } = require('../utils/password');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

function signToken(admin) {
  return jwt.sign({ id: admin.id, role: admin.role }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
}

async function login(username, password) {
  const admin = await Admin.findOne({ where: { username } });
  if (!admin) {
    throw new AppError('INVALID_CREDENTIALS', ERROR_CODES.INVALID_CREDENTIALS, 401);
  }

  const valid = await comparePassword(password, admin.password_hash);
  if (!valid) {
    throw new AppError('INVALID_CREDENTIALS', ERROR_CODES.INVALID_CREDENTIALS, 401);
  }

  if (admin.status !== 'active') {
    throw new AppError('ACCOUNT_INACTIVE', ERROR_CODES.ACCOUNT_INACTIVE, 403);
  }

  const token = signToken(admin);
  return { token, user: admin.toJSON() };
}

async function getMe(userId) {
  const admin = await Admin.findByPk(userId);
  if (!admin) {
    throw new AppError('USER_NOT_FOUND', ERROR_CODES.USER_NOT_FOUND, 404);
  }
  return admin.toJSON();
}

module.exports = { login, getMe, signToken };
