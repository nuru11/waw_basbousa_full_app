const tipService = require('../services/tipService');

async function list(req, res, next) {
  try {
    const data = await tipService.listPayouts({ period: req.query.period });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function pay(req, res, next) {
  try {
    const { period } = req.body;
    const data = await tipService.markPaid(req.params.id, period, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, pay };
