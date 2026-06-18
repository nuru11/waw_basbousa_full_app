const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body.username, req.body.password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

function logout(_req, res) {
  res.json({ success: true, message: 'Logged out' });
}

module.exports = { login, me, logout };
