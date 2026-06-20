import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { api, type ReportSummary } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { translateApiError } from "../../utils/translateApiError";

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ReportSummary>("/reports/summary")
      .then(setSummary)
      .catch((e) => setError(translateApiError(e)));
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
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title={t("dashboard.totalIncome")} value={formatCurrency(summary.income)} />
            <StatCard title={t("dashboard.totalExpense")} value={formatCurrency(summary.expense)} />
            <StatCard
              title={t("dashboard.netProfit")}
              value={formatCurrency(summary.net_profit)}
              subtitle={
                summary.net_profit >= 0
                  ? tCommon("status.profitable")
                  : tCommon("status.loss")
              }
            />
            <StatCard
              title={t("dashboard.pendingPurchases")}
              value={String(summary.pending_purchases)}
            />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
              <h3 className="mb-4 font-semibold text-gray-800 dark:text-white/90">
                {t("dashboard.lowStockAlerts")}
              </h3>
              {summary.low_stock.length === 0 ? (
                <p className="text-sm text-gray-500">{t("dashboard.allStockOk")}</p>
              ) : (
                <ul className="space-y-2">
                  {summary.low_stock.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span>{item.name}</span>
                      <span className="text-error-500">
                        {formatNumber(item.current_stock)} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
              <h3 className="mb-4 font-semibold text-gray-800 dark:text-white/90">
                {t("dashboard.topDishes")}
              </h3>
              {summary.top_dishes.length === 0 ? (
                <p className="text-sm text-gray-500">{t("dashboard.noSalesYet")}</p>
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
                      <span>{formatCurrency(parseFloat(d.total_revenue))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
