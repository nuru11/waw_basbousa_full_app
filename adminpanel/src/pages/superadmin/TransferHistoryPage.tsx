import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import TransferHistoryTable from "../../components/transfers/TransferHistoryTable";
import { SectionCard, StatCard } from "../../components/ui";
import { api, type Transfer } from "../../services/api";
import { computeTransferSummary } from "../../utils/computeTransferSummary";
import { formatCurrency } from "../../utils/formatCurrency";
import { translateApiError } from "../../utils/translateApiError";

const PERIODS = ["all", "today", "yesterday", "week", "month", "quarter"] as const;
type TransferPeriod = (typeof PERIODS)[number];

export default function TransferHistoryPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [period, setPeriod] = useState<TransferPeriod>("all");
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const summary = useMemo(() => computeTransferSummary(transfers), [transfers]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const query = period === "all" ? "/transfers" : `/transfers?period=${period}`;
    api
      .get<Transfer[]>(query)
      .then(setTransfers)
      .catch((e) => setError(translateApiError(e)))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div>
      <PageMeta
        title={t("transferHistory.metaTitle")}
        description={t("transferHistory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("transferHistory")} />
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

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{tCommon("loading")}</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title={tCommon("transfers.totalSent")}
              value={formatCurrency(summary.total_sent)}
              accent="brand"
            />
            <StatCard
              title={tCommon("transfers.pendingAcceptance")}
              value={formatCurrency(summary.total_pending)}
              accent="warning"
            />
            <StatCard
              title={tCommon("transfers.accepted")}
              value={formatCurrency(summary.total_transferred)}
              accent="success"
            />
            <StatCard
              title={tCommon("transfers.totalSpent")}
              value={formatCurrency(summary.total_spent)}
              accent="orange"
            />
            <StatCard
              title={tCommon("transfers.totalRemaining")}
              value={formatCurrency(summary.total_remaining)}
              accent={summary.total_remaining < 0 ? "error" : "success"}
            />
          </div>

          <SectionCard
            title={tCommon("transfers.transferHistory")}
            count={tCommon("periodFilters.entryCount", { count: transfers.length })}
          >
            <TransferHistoryTable
              transfers={transfers}
              emptyMessage={t("transferHistory.empty")}
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}
