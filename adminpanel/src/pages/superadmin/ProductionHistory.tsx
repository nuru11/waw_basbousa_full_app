import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  DataTable,
  EmptyState,
  SectionCard,
  StatCard,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { api, type ProductionLog } from "../../services/api";
import { formatShortDate, formatTime } from "../../utils/formatDate";
import { formatNumber } from "../../utils/formatNumber";
import { plateWeightToKg } from "../../utils/plateWeight";
import { translateApiError } from "../../utils/translateApiError";

export default function ProductionHistoryPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ProductionLog[]>("/stock/production")
      .then(setLogs)
      .catch((e) => setError(translateApiError(e)));
  }, []);

  const summary = useMemo(() => {
    const totalPlates = logs.reduce((sum, log) => sum + log.plates_count, 0);
    const byPlate = new Map<string, number>();
    const byChief = new Map<string, number>();

    for (const log of logs) {
      const plateName = log.dish?.name ?? tCommon("plateFallback", { id: log.dish_id });
      const chiefName = log.chief?.name ?? tCommon("unknownChief");
      byPlate.set(plateName, (byPlate.get(plateName) ?? 0) + log.plates_count);
      byChief.set(chiefName, (byChief.get(chiefName) ?? 0) + log.plates_count);
    }

    return { totalPlates, byPlate, byChief };
  }, [logs, tCommon]);

  const logColumns: DataTableColumn<ProductionLog>[] = useMemo(
    () => [
      {
        key: "date",
        header: tCommon("fields.date"),
        cellClassName: "whitespace-nowrap",
        render: (log) => (
          <>
            {formatShortDate(log.logged_at)}
            <span className="block text-xs text-gray-400">
              {formatTime(log.logged_at)}
            </span>
          </>
        ),
      },
      {
        key: "chief",
        header: tCommon("fields.chief"),
        render: (log) => (
          <>
            {log.chief?.name ?? tCommon("emDash")}
            {log.chief?.short_id && (
              <span className="block text-xs text-gray-400">
                {tCommon("idShort", { id: log.chief.short_id })}
              </span>
            )}
          </>
        ),
      },
      {
        key: "plate",
        header: tCommon("fields.plate"),
        render: (log) => log.dish?.name ?? tCommon("emDash"),
      },
      {
        key: "weight",
        header: tCommon("fields.weightKg"),
        render: (log) =>
          formatNumber(
            plateWeightToKg(log.plate_weight_grams ?? log.dish?.plate_weight_grams)
          ),
      },
      {
        key: "notes",
        header: tCommon("fields.notes"),
        render: (log) => log.notes || tCommon("emDash"),
      },
    ],
    [tCommon]
  );

  return (
    <div>
      <PageMeta
        title={t("productionHistory.metaTitle")}
        description={t("productionHistory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("platesMadeByChief")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title={t("productionHistory.totalPlatesMade")}
          value={String(summary.totalPlates)}
          accent="brand"
        />
        <StatCard
          title={t("productionHistory.productionEntries")}
          value={String(logs.length)}
          accent="neutral"
        />
        <SectionCard title={t("productionHistory.byChief")}>
          {summary.byChief.size === 0 ? (
            <EmptyState message={t("productionHistory.noLogsYet")} />
          ) : (
            <ul className="space-y-1 text-sm">
              {[...summary.byChief.entries()].map(([name, count]) => (
                <li
                  key={name}
                  className="flex justify-between gap-4 text-gray-600 dark:text-gray-400"
                >
                  <span>{name}</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <SectionCard title={t("productionHistory.byPlate")} className="lg:col-span-1">
          {summary.byPlate.size === 0 ? (
            <EmptyState message={t("productionHistory.noProductionLogged")} />
          ) : (
            <ul className="space-y-2 text-sm">
              {[...summary.byPlate.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                  <li
                    key={name}
                    className="flex justify-between gap-2 border-b border-gray-100 pb-2 dark:border-gray-800"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{name}</span>
                    <span className="font-semibold text-brand-500">{count}</span>
                  </li>
                ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title={t("productionHistory.productionLog")}
          className="lg:col-span-3"
        >
          <DataTable
            columns={logColumns}
            data={logs}
            keyExtractor={(log) => log.id}
            emptyMessage={t("productionHistory.noPlatesLogged")}
            hoverRows
          />
        </SectionCard>
      </div>
    </div>
  );
}
