const adminService = require('../services/adminService');

async function list(req, res, next) {
  try {
    const admins = await adminService.listAdmins();
    res.json({ success: true, data: admins });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const admin = await adminService.getAdmin(req.params.id);
    res.json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const admin = await adminService.createAdmin(req.body);
    res.status(201).json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const admin = await adminService.updateAdmin(req.params.id, req.body);
    res.json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await adminService.deleteAdmin(req.params.id, req.user.id);
    res.json({ success: true, message: 'Admin deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
