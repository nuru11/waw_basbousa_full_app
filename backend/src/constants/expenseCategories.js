const EXPENSE_CATEGORIES = ['rental', 'salaries', 'electricity', 'other', 'tips'];

function isValidExpenseCategory(category) {
  return EXPENSE_CATEGORIES.includes(category);
}

module.exports = { EXPENSE_CATEGORIES, isValidExpenseCategory };
