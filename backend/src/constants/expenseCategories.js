const EXPENSE_CATEGORIES = ['rental', 'salaries', 'electricity', 'other'];

function isValidExpenseCategory(category) {
  return EXPENSE_CATEGORIES.includes(category);
}

module.exports = { EXPENSE_CATEGORIES, isValidExpenseCategory };
