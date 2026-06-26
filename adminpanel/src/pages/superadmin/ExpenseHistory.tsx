import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ExpensesTable from "../../components/expenses/ExpensesTable";
import { SectionCard } from "../../components/ui";
import { api, type Expense, type ExpenseCategory } from "../../services/api";
import { translateApiError } from "../../utils/translateApiError";
import { EXPENSE_CATEGORIES, expenseCategoryLabel } from "../../utils/expenseCategory";

const PERIODS = ["all", "today", "yesterday", "week", "month", "quarter"] as const;
type ExpensePeriod = (typeof PERIODS)[number];

const CATEGORY_FILTERS = ["all", ...EXPENSE_CATEGORIES] as const;
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

export default function ExpenseHistoryPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [period, setPeriod] = useState<ExpensePeriod>("month");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (period !== "all") params.set("period", period);
    if (category !== "all") params.set("category", category);
    const query = params.toString();
    api
      .get<Expense[]>(`/expenses${query ? `?${query}` : ""}`)
      .then(setExpenses)
      .catch((e) => setError(translateApiError(e)))
      .finally(() => setLoading(false));
  }, [period, category]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(expense: Expense) {
    if (!window.confirm(t("expenses.deleteConfirm"))) return;

    setDeletingId(expense.id);
    setError("");
    try {
      await api.delete(`/expenses/${expense.id}`);
      load();
    } catch (e) {
      setError(translateApiError(e));
    } finally {
      setDeletingId(null);
    }
  }

  function categoryFilterLabel(value: CategoryFilter): string {
    if (value === "all") return tCommon("periodFilters.all");
    return expenseCategoryLabel(value as ExpenseCategory, t);
  }

  return (
    <div>
      <PageMeta
        title={t("expenses.historyMetaTitle")}
        description={t("expenses.historyMetaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("expenseHistory")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}

      <div className="mb-4 flex flex-wrap gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
        {PERIODS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={`rounded-md px-3 py-2 text-theme-sm font-medium hover:text-gray-900 dark:hover:text-white ${
              period === value
                ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {tCommon(`periodFilters.${value}`)}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
        {CATEGORY_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={`rounded-md px-3 py-2 text-theme-sm font-medium hover:text-gray-900 dark:hover:text-white ${
              category === value
                ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {categoryFilterLabel(value)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{tCommon("loading")}</p>
      ) : (
        <SectionCard
          title={t("expenses.historyTitle")}
          count={tCommon("periodFilters.entryCount", { count: expenses.length })}
        >
          <ExpensesTable
            expenses={expenses}
            emptyMessage={t("expenses.historyEmpty")}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </SectionCard>
      )}
    </div>
  );
}
