const { sequelize, Admin, SalaryPayment, Expense } = require('../models');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { formatDateYmd } = require('../utils/dateUtils');

const PAY_PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function currentPayPeriod() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function parsePayPeriod(period) {
  const value = period || currentPayPeriod();
  if (!PAY_PERIOD_RE.test(value)) {
    throw new AppError('INVALID_PAY_PERIOD', ERROR_CODES.INVALID_PAY_PERIOD, 400);
  }
  return value;
}

function formatPayPeriodLabel(period) {
  const [year, month] = period.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

async function getEmployeeOrThrow(employeeId, transaction) {
  const employee = await Admin.findByPk(employeeId, { transaction });
  if (!employee) {
    throw new AppError('ADMIN_NOT_FOUND', ERROR_CODES.ADMIN_NOT_FOUND, 404);
  }
  if (employee.role !== 'employee') {
    throw new AppError('NOT_AN_EMPLOYEE', ERROR_CODES.NOT_AN_EMPLOYEE, 400);
  }
  return employee;
}

async function listPayroll({ period } = {}) {
  const payPeriod = parsePayPeriod(period);

  const employees = await Admin.findAll({
    where: { role: 'employee', status: 'active' },
    attributes: ['id', 'name', 'short_id', 'status', 'monthly_salary'],
    order: [['name', 'ASC']],
  });

  const payments = await SalaryPayment.findAll({
    where: { pay_period: payPeriod },
    attributes: ['id', 'employee_id', 'amount', 'paid_at', 'expense_id'],
  });

  const paymentByEmployee = new Map(payments.map((p) => [p.employee_id, p]));

  let totalPayroll = 0;
  let paidCount = 0;
  let paidAmount = 0;

  const rows = employees.map((employee) => {
    const salary = employee.monthly_salary != null ? parseFloat(employee.monthly_salary) : null;
    const payment = paymentByEmployee.get(employee.id);

    if (salary && salary > 0) {
      totalPayroll += salary;
      if (payment) {
        paidCount += 1;
        paidAmount += parseFloat(payment.amount);
      }
    }

    return {
      id: employee.id,
      name: employee.name,
      short_id: employee.short_id,
      status: employee.status,
      monthly_salary: salary,
      payment: payment
        ? {
            paid_at: payment.paid_at,
            amount: parseFloat(payment.amount),
            expense_id: payment.expense_id,
          }
        : null,
    };
  });

  const pendingCount = rows.filter(
    (r) => r.monthly_salary && r.monthly_salary > 0 && !r.payment
  ).length;

  return {
    period: payPeriod,
    summary: {
      total_payroll: totalPayroll,
      paid_count: paidCount,
      pending_count: pendingCount,
      paid_amount: paidAmount,
    },
    employees: rows,
  };
}

async function setEmployeeSalary(employeeId, amount) {
  const salary = parseFloat(amount);
  if (!salary || salary <= 0) {
    throw new AppError('VALIDATION_AMOUNT_POSITIVE', ERROR_CODES.VALIDATION_AMOUNT_POSITIVE, 400);
  }

  const employee = await getEmployeeOrThrow(employeeId);
  await employee.update({ monthly_salary: salary });

  return {
    id: employee.id,
    name: employee.name,
    short_id: employee.short_id,
    status: employee.status,
    monthly_salary: salary,
  };
}

async function markPaid(employeeId, period, paidBy) {
  const payPeriod = parsePayPeriod(period);
  const transaction = await sequelize.transaction();

  try {
    const employee = await getEmployeeOrThrow(employeeId, transaction);

    if (employee.status !== 'active') {
      throw new AppError('ACCOUNT_INACTIVE', ERROR_CODES.ACCOUNT_INACTIVE, 400);
    }

    const salary = employee.monthly_salary != null ? parseFloat(employee.monthly_salary) : 0;
    if (!salary || salary <= 0) {
      throw new AppError('SALARY_NOT_SET', ERROR_CODES.SALARY_NOT_SET, 400);
    }

    const existing = await SalaryPayment.findOne({
      where: { employee_id: employeeId, pay_period: payPeriod },
      transaction,
    });
    if (existing) {
      throw new AppError('SALARY_ALREADY_PAID', ERROR_CODES.SALARY_ALREADY_PAID, 400);
    }

    const today = formatDateYmd(new Date());
    const description = `Salary — ${employee.name} — ${formatPayPeriodLabel(payPeriod)}`;

    const expense = await Expense.create(
      {
        category: 'salaries',
        amount: salary,
        description,
        spent_at: today,
        created_by: paidBy,
      },
      { transaction }
    );

    const payment = await SalaryPayment.create(
      {
        employee_id: employeeId,
        pay_period: payPeriod,
        amount: salary,
        expense_id: expense.id,
        paid_at: new Date(),
        paid_by: paidBy,
      },
      { transaction }
    );

    await transaction.commit();

    return {
      employee_id: employee.id,
      period: payPeriod,
      payment: {
        paid_at: payment.paid_at,
        amount: salary,
        expense_id: expense.id,
      },
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  listPayroll,
  setEmployeeSalary,
  markPaid,
  currentPayPeriod,
};
