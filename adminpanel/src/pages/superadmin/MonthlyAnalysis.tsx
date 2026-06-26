import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import {
  DataTable,
  EmptyState,
  SectionCard,
  StatCard,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import {
  api,
  type MonthlyAnalysis,
  type MonthlyAnalysisDayRow,
  type MonthlyAnalysisDishRow,
  type MonthlyAnalysisSellerRow,
} from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  currentMonthInput,
  expenseCategoryLabel,
  formatPayPeriodLabel,
  formatSpentDate,
} from "../../utils/expenseCategory";
import { PAYMENT_OPTIONS } from "../../utils/paymentMethods";
import { translateApiError } from "../../utils/translateApiError";

export default function MonthlyAnalysisPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [period, setPeriod] = useState(currentMonthInput());
  const [analysis, setAnalysis] = useState<MonthlyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .get<MonthlyAnalysis>(`/reports/monthly?period=${period}`)
      .then(setAnalysis)
      .catch((e) => setError(translateApiError(e)))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const dishColumns: DataTableColumn<MonthlyAnalysisDishRow>[] = useMemo(
    () => [
      {
        key: "dish",
        header: tCommon("fields.plate"),
        render: (row) => row.dish_name,
      },
      {
        key: "sales",
        header: tCommon("sales.sales"),
        render: (row) => String(row.sale_count),
      },
      {
        key: "revenue",
        header: tCommon("sales.revenue"),
        render: (row) => formatCurrency(row.revenue),
      },
    ],
    [tCommon]
  );

  const sellerColumns: DataTableColumn<MonthlyAnalysisSellerRow>[] = useMemo(
    () => [
      {
        key: "seller",
        header: tCommon("fields.seller"),
        render: (row) => row.seller_name,
      },
      {
        key: "sales",
        header: tCommon("sales.sales"),
        render: (row) => String(row.sale_count),
      },
      {
        key: "revenue",
        header: tCommon("sales.revenue"),
        render: (row) => formatCurrency(row.revenue),
      },
    ],
    [tCommon]
  );

  const dayColumns: DataTableColumn<MonthlyAnalysisDayRow>[] = useMemo(
    () => [
      {
        key: "date",
        header: tCommon("fields.date"),
        render: (row) => formatSpentDate(row.date),
      },
      {
        key: "income",
        header: t("monthlyAnalysis.income"),
        render: (row) => formatCurrency(row.income),
      },
      {
        key: "ingredient",
        header: t("monthlyAnalysis.ingredientCost"),
        render: (row) => formatCurrency(row.ingredient_expense),
      },
      {
        key: "operating",
        header: t("monthlyAnalysis.operatingCost"),
        render: (row) => formatCurrency(row.operating_expense),
      },
      {
        key: "net",
        header: t("monthlyAnalysis.dailyNet"),
        render: (row) => (
          <span
            className={
              row.net >= 0
                ? "text-success-600 dark:text-success-400"
                : "text-error-600 dark:text-error-400"
            }
          >
            {formatCurrency(row.net)}
          </span>
        ),
      },
    ],
    [t, tCommon]
  );

  const paymentRows = useMemo(() => {
    if (!analysis) return [];
    return PAYMENT_OPTIONS.map((method) => ({
      method,
      amount: analysis.payments[method] ?? 0,
    })).filter((row) => row.amount > 0);
  }, [analysis]);

  const spendCategories = [
    { key: "salaries" as const, accent: "warning" as const },
    { key: "rental" as const, accent: "warning" as const },
    { key: "electricity" as const, accent: "warning" as const },
    { key: "other" as const, accent: "warning" as const },
  ];

  return (
    <div>
      <PageMeta
        title={t("monthlyAnalysis.metaTitle")}
        description={t("monthlyAnalysis.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("monthlyAnalysis")} />

      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <Label>{t("monthlyAnalysis.period")}</Label>
          <Input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-44"
          />
        </div>
        <p className="pb-2 text-sm text-gray-500 dark:text-gray-400">
          {formatPayPeriodLabel(period)}
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{tCommon("loading")}</p>
      ) : (
        analysis && (
          <>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard
                title={t("monthlyAnalysis.totalIncome")}
                value={formatCurrency(analysis.income)}
                subtitle={t("monthlyAnalysis.saleCount", {
                  count: analysis.sale_count,
                })}
                accent="brand"
              />
              <StatCard
                title={t("monthlyAnalysis.totalSpend")}
                value={formatCurrency(analysis.expense)}
                accent="warning"
              />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {spendCategories.map(({ key, accent }) => (
                <StatCard
                  key={key}
                  title={expenseCategoryLabel(key, t)}
                  value={formatCurrency(analysis.expense_by_category[key])}
                  accent={accent}
                />
              ))}
              <StatCard
                title={t("monthlyAnalysis.ingredientCost")}
                value={formatCurrency(analysis.ingredient_expense)}
                subtitle={t("monthlyAnalysis.purchaseCount", {
                  count: analysis.purchase_count,
                })}
                accent="orange"
              />
            </div>

            <div className="mb-6">
              <SectionCard title={t("monthlyAnalysis.paymentMethods")}>
                {paymentRows.length === 0 ? (
                  <EmptyState message={t("monthlyAnalysis.noSales")} />
                ) : (
                  <ul className="space-y-2">
                    {paymentRows.map((row) => (
                      <li
                        key={row.method}
                        className="flex items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <span>{tCommon(`paymentMethods.${row.method}`)}</span>
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {formatCurrency(row.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard
                title={t("monthlyAnalysis.topDishes")}
                count={tCommon("periodFilters.entryCount", {
                  count: analysis.top_dishes.length,
                })}
              >
                <DataTable
                  columns={dishColumns}
                  data={analysis.top_dishes}
                  keyExtractor={(row) => row.dish_id}
                  emptyMessage={t("monthlyAnalysis.noSales")}
                />
              </SectionCard>

              <SectionCard
                title={t("monthlyAnalysis.bySeller")}
                count={tCommon("periodFilters.entryCount", {
                  count: analysis.by_seller.length,
                })}
              >
                <DataTable
                  columns={sellerColumns}
                  data={analysis.by_seller}
                  keyExtractor={(row) => row.seller_id}
                  emptyMessage={t("monthlyAnalysis.noSales")}
                />
              </SectionCard>
            </div>

            <SectionCard title={t("monthlyAnalysis.dailyBreakdown")}>
              <DataTable
                columns={dayColumns}
                data={analysis.by_day}
                keyExtractor={(row) => row.date}
                emptyMessage={t("monthlyAnalysis.noData")}
              />
            </SectionCard>
          </>
        )
      )}
    </div>
  );
}
