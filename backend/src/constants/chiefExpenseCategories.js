const CHIEF_EXPENSE_CATEGORIES = ['food', 'hotel', 'other'];

function isValidChiefExpenseCategory(category) {
  return CHIEF_EXPENSE_CATEGORIES.includes(category);
}

module.exports = { CHIEF_EXPENSE_CATEGORIES, isValidChiefExpenseCategory };
