const { Admin } = require('../models');
const { hashPassword } = require('../utils/password');
const { generateShortId } = require('../utils/shortId');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const ROLES = ['superAdmin', 'purchaser', 'chief', 'employee'];
const STATUSES = ['active', 'inactive'];

async function listAdmins() {
  return Admin.findAll({ order: [['created_at', 'DESC']] });
}

async function listActiveChiefs() {
  return Admin.findAll({
    where: { role: 'chief', status: 'active' },
    attributes: ['id', 'name', 'short_id'],
    order: [['name', 'ASC']],
  });
}

async function getAdmin(id) {
  const admin = await Admin.findByPk(id);
  if (!admin) throw new AppError('ADMIN_NOT_FOUND', ERROR_CODES.ADMIN_NOT_FOUND, 404);
  return admin;
}

async function createAdmin(data) {
  if (!ROLES.includes(data.role)) {
    throw new AppError('INVALID_ROLE', ERROR_CODES.INVALID_ROLE, 422);
  }

  const existing = await Admin.findOne({ where: { username: data.username } });
  if (existing) throw new AppError('USERNAME_EXISTS', ERROR_CODES.USERNAME_EXISTS, 409);

  const shortId = await generateShortId();
  const passwordHash = await hashPassword(data.password);

  return Admin.create({
    name: data.name,
    username: data.username,
    password_hash: passwordHash,
    phone: data.phone || null,
    role: data.role,
    short_id: shortId,
    status: 'active',
  });
}

async function updateAdmin(id, data, currentUserId) {
  const admin = await getAdmin(id);

  if (data.username && data.username !== admin.username) {
    const existing = await Admin.findOne({ where: { username: data.username } });
    if (existing) throw new AppError('USERNAME_EXISTS', ERROR_CODES.USERNAME_EXISTS, 409);
  }

  if (data.role && !ROLES.includes(data.role)) {
    throw new AppError('INVALID_ROLE', ERROR_CODES.INVALID_ROLE, 422);
  }

  if (data.status && !STATUSES.includes(data.status)) {
    throw new AppError('INVALID_STATUS', ERROR_CODES.INVALID_STATUS, 422);
  }

  if (data.status === 'inactive' && Number(id) === Number(currentUserId)) {
    throw new AppError('CANNOT_DEACTIVATE_SELF', ERROR_CODES.CANNOT_DEACTIVATE_SELF, 400);
  }

  const updates = {};
  if (data.name) updates.name = data.name;
  if (data.username) updates.username = data.username;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.role) updates.role = data.role;
  if (data.status) updates.status = data.status;
  if (data.password) updates.password_hash = await hashPassword(data.password);

  await admin.update(updates);
  return admin;
}

async function deleteAdmin(id, currentUserId) {
  if (Number(id) === Number(currentUserId)) {
    throw new AppError('CANNOT_DELETE_SELF', ERROR_CODES.CANNOT_DELETE_SELF, 400);
  }
  const admin = await getAdmin(id);
  await admin.destroy();
}

module.exports = {
  listAdmins,
  listActiveChiefs,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
};
