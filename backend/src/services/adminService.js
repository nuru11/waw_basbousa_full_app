const { Admin } = require('../models');
const { hashPassword } = require('../utils/password');
const { generateShortId } = require('../utils/shortId');
const AppError = require('../utils/AppError');

const ROLES = ['superAdmin', 'purchaser', 'chief', 'employee'];
const STATUSES = ['active', 'inactive'];

async function listAdmins() {
  return Admin.findAll({ order: [['created_at', 'DESC']] });
}

async function getAdmin(id) {
  const admin = await Admin.findByPk(id);
  if (!admin) throw new AppError('Admin not found', 404);
  return admin;
}

async function createAdmin(data) {
  if (!ROLES.includes(data.role)) {
    throw new AppError('Invalid role', 422);
  }

  const existing = await Admin.findOne({ where: { username: data.username } });
  if (existing) throw new AppError('Username already exists', 409);

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
    if (existing) throw new AppError('Username already exists', 409);
  }

  if (data.role && !ROLES.includes(data.role)) {
    throw new AppError('Invalid role', 422);
  }

  if (data.status && !STATUSES.includes(data.status)) {
    throw new AppError('Invalid status', 422);
  }

  if (data.status === 'inactive' && Number(id) === Number(currentUserId)) {
    throw new AppError('Cannot deactivate your own account', 400);
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
    throw new AppError('Cannot delete your own account', 400);
  }
  const admin = await getAdmin(id);
  await admin.destroy();
}

module.exports = {
  listAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
};
