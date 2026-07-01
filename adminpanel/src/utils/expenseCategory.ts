import type { ExpenseCategory } from "../services/api";
import type { StatusBadgeVariant } from "../components/ui/status-badge/StatusBadge";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "rental",
  "salaries",
  "electricity",
  "other",
  "tips",
];

export const RECORD_EXPENSE_CATEGORIES = EXPENSE_CATEGORIES.filter(
  (c) => c !== "salaries" && c !== "tips"
) as Exclude<ExpenseCategory, "salaries" | "tips">[];

export function expenseCategoryVariant(category: ExpenseCategory): StatusBadgeVariant {
  switch (category) {
    case "rental":
      return "cbe";
    case "salaries":
      return "active";
    case "tips":
      return "info";
    case "electricity":
      return "pending";
    case "other":
      return "other";
    default:
      return "info";
  }
}

export function expenseCategoryLabel(
  category: ExpenseCategory | "chief_expenses",
  t: (key: string) => string
): string {
  if (category === "chief_expenses") {
    return t("chiefExpenses.breakdownLabel");
  }
  return t(`expenses.categories.${category}`);
}

export function formatSpentDate(date: string): string {
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return date;
  return `${d}/${m}/${y}`;
}

export function todayDateInput(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function currentMonthInput(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatPayPeriodLabel(period: string): string {
  const [y, m] = period.split("-");
  if (!y || !m) return period;
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatPaidDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString();
}
