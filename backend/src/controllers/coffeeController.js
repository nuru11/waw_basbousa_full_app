const coffeeService = require('../services/coffeeService');

async function getSettings(req, res, next) {
  try {
    const data = await coffeeService.getSettingsWithAvailability();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const data = await coffeeService.updateSettings(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings };
