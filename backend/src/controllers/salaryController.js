const salaryService = require('../services/salaryService');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

async function list(req, res, next) {
  try {
    const data = await salaryService.listPayroll({ period: req.query.period });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function setSalary(req, res, next) {
  try {
    const { monthly_salary } = req.body;
    if (monthly_salary === undefined || monthly_salary === null || monthly_salary === '') {
      throw new AppError('VALIDATION_AMOUNT_POSITIVE', ERROR_CODES.VALIDATION_AMOUNT_POSITIVE, 400);
    }
    const data = await salaryService.setEmployeeSalary(req.params.id, monthly_salary);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function pay(req, res, next) {
  try {
    const { period } = req.body;
    const data = await salaryService.markPaid(req.params.id, period, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, setSalary, pay };
