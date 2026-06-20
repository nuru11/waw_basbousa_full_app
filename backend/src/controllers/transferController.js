const transferService = require('../services/transferService');

const SUPER_ADMIN_PERIODS = [
  'today',
  'yesterday',
  'week',
  'month',
  'quarter',
  'all',
  'history',
];

async function list(req, res, next) {
  try {
    const purchaserId = req.user.role === 'purchaser' ? req.user.id : undefined;
    const requestedPeriod = req.query.period;
    let period;

    if (req.user.role === 'superAdmin') {
      period = SUPER_ADMIN_PERIODS.includes(requestedPeriod)
        ? requestedPeriod === 'all'
          ? undefined
          : requestedPeriod
        : undefined;
    } else if (requestedPeriod === 'today') {
      period = 'today';
    }

    const status =
      ['pending', 'accepted'].includes(req.query.status) ? req.query.status : undefined;

    const transfers = await transferService.listTransfers({
      purchaserId,
      period,
      status,
      dateField: req.query.date_field || undefined,
    });
    res.json({ success: true, data: transfers });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const transfer = await transferService.createTransfer(req.user.id, req.body);
    res.status(201).json({ success: true, data: transfer });
  } catch (err) {
    next(err);
  }
}

async function balance(req, res, next) {
  try {
    const summary = await transferService.getBalanceSummary(req.user.id);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    const data = await transferService.getAdminSummary();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function accept(req, res, next) {
  try {
    const transfer = await transferService.acceptTransfer(
      parseInt(req.params.id, 10),
      req.user.id
    );
    res.json({ success: true, data: transfer });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, balance, summary, accept };
