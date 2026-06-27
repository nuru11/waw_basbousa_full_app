import type { ChiefExpenseCategory } from "../services/api";
import type { StatusBadgeVariant } from "../components/ui/status-badge/StatusBadge";

export const CHIEF_EXPENSE_CATEGORIES: ChiefExpenseCategory[] = [
  "food",
  "hotel",
  "other",
];

export function chiefExpenseCategoryLabel(
  category: ChiefExpenseCategory,
  t: (key: string) => string
): string {
  return t(`chiefExpenses.categories.${category}`);
}

export function chiefExpenseCategoryVariant(
  category: ChiefExpenseCategory
): StatusBadgeVariant {
  switch (category) {
    case "food":
      return "active";
    case "hotel":
      return "cbe";
    case "other":
      return "other";
    default:
      return "info";
  }
}
