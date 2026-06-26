import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  EmptyState,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/ui";
import { api, type ExpenseSummary, type ReportSummary } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { translateApiError } from "../../utils/translateApiError";
import {
  EXPENSE_CATEGORIES,
  expenseCategoryLabel,
  expenseCategoryVariant,
} from "../../utils/expenseCategory";

export default function AdminDashboard() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [expenseMonth, setExpenseMonth] = useState<ExpenseSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ReportSummary>("/reports/summary")
      .then(setSummary)
      .catch((e) => setError(translateApiError(e)));
    api
      .get<ExpenseSummary>("/expenses/summary?period=month")
      .then(setExpenseMonth)
      .catch(() => {});
  }, []);

  return (
    <div>
      <PageMeta
        title={t("dashboard.metaTitle")}
        description={t("dashboard.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("dashboard")} />
      {error && <p className="mb-4 text-error-500">{error}</p>}
      {summary && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              title={t("dashboard.totalIncome")}
              value={formatCurrency(summary.income)}
              accent="brand"
            />
            <StatCard
              title={t("dashboard.ingredientExpense")}
              value={formatCurrency(summary.ingredient_expense ?? summary.expense)}
              accent="orange"
            />
            <StatCard
              title={t("dashboard.operatingExpense")}
              value={formatCurrency(summary.operating_expense ?? 0)}
              accent="warning"
            />
            <StatCard
              title={t("dashboard.netProfit")}
              value={formatCurrency(summary.net_profit)}
              subtitle={
                summary.net_profit >= 0
                  ? tCommon("status.profitable")
                  : tCommon("status.loss")
              }
              accent={summary.net_profit >= 0 ? "success" : "error"}
            />
            <StatCard
              title={t("dashboard.activeInventory")}
              value={String(summary.active_inventory)}
              accent="warning"
            />
          </div>
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {expenseMonth && (
              <SectionCard title={t("dashboard.operatingExpensesThisMonth")}>
                {expenseMonth.total === 0 ? (
                  <EmptyState message={t("dashboard.noOperatingExpenses")} />
                ) : (
                  <ul className="space-y-2">
                    {EXPENSE_CATEGORIES.map((cat) => {
                      const amount = expenseMonth.by_category[cat];
                      if (amount <= 0) return null;
                      return (
                        <li
                          key={cat}
                          className="flex items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <StatusBadge variant={expenseCategoryVariant(cat)}>
                            {expenseCategoryLabel(cat, t)}
                          </StatusBadge>
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {formatCurrency(amount)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SectionCard>
            )}
            <SectionCard title={t("dashboard.lowStockAlerts")}>
              {summary.low_stock.length === 0 ? (
                <EmptyState message={t("dashboard.allStockOk")} />
              ) : (
                <ul className="space-y-2">
                  {summary.low_stock.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span>{item.name}</span>
                      <StatusBadge variant="low_stock">
                        {formatNumber(item.current_stock)} {item.unit}
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
            <SectionCard title={t("dashboard.topDishes")}>
              {summary.top_dishes.length === 0 ? (
                <EmptyState message={t("dashboard.noSalesYet")} />
              ) : (
                <ul className="space-y-2">
                  {summary.top_dishes.map((d) => (
                    <li
                      key={d.dish_id}
                      className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span>
                        {d.dish?.name ||
                          tCommon("dishFallback", { id: d.dish_id })}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {formatCurrency(parseFloat(d.total_revenue))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
