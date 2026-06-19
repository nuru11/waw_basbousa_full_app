import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { api, type ReportSummary } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";

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
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ReportSummary>("/reports/summary")
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div>
      <PageMeta title="Dashboard | Restaurant" description="Admin dashboard" />
      <PageBreadcrumb pageTitle="Dashboard" />
      {error && <p className="mb-4 text-error-500">{error}</p>}
      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Income" value={fmt(summary.income)} />
            <StatCard title="Total Expense" value={fmt(summary.expense)} />
            <StatCard
              title="Net Profit"
              value={fmt(summary.net_profit)}
              subtitle={summary.net_profit >= 0 ? "Profitable" : "Loss"}
            />
            <StatCard
              title="Pending Purchases"
              value={String(summary.pending_purchases)}
            />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
              <h3 className="mb-4 font-semibold text-gray-800 dark:text-white/90">
                Low Stock Alerts
              </h3>
              {summary.low_stock.length === 0 ? (
                <p className="text-sm text-gray-500">All stock levels OK</p>
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
                Top Dishes
              </h3>
              {summary.top_dishes.length === 0 ? (
                <p className="text-sm text-gray-500">No sales yet</p>
              ) : (
                <ul className="space-y-2">
                  {summary.top_dishes.map((d) => (
                    <li
                      key={d.dish_id}
                      className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span>{d.dish?.name || `Dish #${d.dish_id}`}</span>
                      <span>{fmt(parseFloat(d.total_revenue))}</span>
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
