import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  DataTable,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { api, type ChiefExpense } from "../../services/api";
import {
  chiefExpenseCategoryLabel,
  chiefExpenseCategoryVariant,
} from "../../utils/chiefExpenseCategory";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatSpentDate } from "../../utils/expenseCategory";
import { translateApiError } from "../../utils/translateApiError";

const PERIODS = ["week", "month", "all"] as const;
type ListPeriod = (typeof PERIODS)[number];

export default function ChiefExpensesViewPage() {
  const { t } = useTranslation("chief");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [period, setPeriod] = useState<ListPeriod>("month");
  const [expenses, setExpenses] = useState<ChiefExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const query = period === "all" ? "" : `?period=${period}`;
    api
      .get<ChiefExpense[]>(`/chief-expenses${query}`)
      .then(setExpenses)
      .catch((e) => setError(translateApiError(e)))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const periodTotal = useMemo(
    () => expenses.reduce((sum, row) => sum + parseFloat(String(row.amount)), 0),
    [expenses]
  );

  const columns: DataTableColumn<ChiefExpense>[] = useMemo(
    () => [
      {
        key: "date",
        header: tCommon("fields.date"),
        render: (row) => formatSpentDate(row.spent_at),
      },
      {
        key: "category",
        header: tCommon("fields.category"),
        render: (row) => (
          <StatusBadge variant={chiefExpenseCategoryVariant(row.category)}>
            {chiefExpenseCategoryLabel(row.category, t)}
          </StatusBadge>
        ),
      },
      {
        key: "amount",
        header: tCommon("fields.amount"),
        render: (row) => formatCurrency(parseFloat(String(row.amount))),
      },
      {
        key: "description",
        header: tCommon("fields.description"),
        render: (row) => row.description ?? "—",
      },
    ],
    [t, tCommon]
  );

  return (
    <div>
      <PageMeta
        title={t("chiefExpenses.metaTitle")}
        description={t("chiefExpenses.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("chiefExpenses")} />

      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}

      {!loading && (
        <div className="mb-6">
          <StatCard
            title={t("chiefExpenses.periodTotal")}
            value={formatCurrency(periodTotal)}
            subtitle={tCommon("periodFilters.entryCount", { count: expenses.length })}
            accent="brand"
          />
        </div>
      )}

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

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{tCommon("loading")}</p>
      ) : (
        <SectionCard
          title={t("chiefExpenses.title")}
          count={tCommon("periodFilters.entryCount", { count: expenses.length })}
        >
          <DataTable
            columns={columns}
            data={expenses}
            keyExtractor={(row) => row.id}
            emptyMessage={t("chiefExpenses.empty")}
          />
        </SectionCard>
      )}
    </div>
  );
}
