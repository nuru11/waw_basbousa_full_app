const waterService = require('../services/waterService');

async function getSettings(req, res, next) {
  try {
    const data = await waterService.getSettingsWithAvailability();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const data = await waterService.updateSettings(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function adjustStock(req, res, next) {
  try {
    const data = await waterService.adjustStockBottles(req.body, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings, adjustStock };
