const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const jwtConfig = require('../config/jwt');
const { comparePassword } = require('../utils/password');
const AppError = require('../utils/AppError');

function signToken(admin) {
  return jwt.sign({ id: admin.id, role: admin.role }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
}

async function login(username, password) {
  const admin = await Admin.findOne({ where: { username } });
  if (!admin) {
    throw new AppError('Invalid username or password', 401);
  }

  const valid = await comparePassword(password, admin.password_hash);
  if (!valid) {
    throw new AppError('Invalid username or password', 401);
  }

  const token = signToken(admin);
  return { token, user: admin.toJSON() };
}

async function getMe(userId) {
  const admin = await Admin.findByPk(userId);
  if (!admin) {
    throw new AppError('User not found', 404);
  }
  return admin.toJSON();
}

module.exports = { login, getMe, signToken };
