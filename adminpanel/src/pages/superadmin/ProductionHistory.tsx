import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
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

  return (
    <div>
      <PageMeta
        title={t("productionHistory.metaTitle")}
        description={t("productionHistory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("platesMadeByChief")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500">{t("productionHistory.totalPlatesMade")}</p>
          <p className="mt-1 text-3xl font-bold text-brand-500">{summary.totalPlates}</p>
        </div>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500">{t("productionHistory.productionEntries")}</p>
          <p className="mt-1 text-3xl font-bold text-gray-800 dark:text-white/90">{logs.length}</p>
        </div>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="mb-2 text-sm text-gray-500">{t("productionHistory.byChief")}</p>
          {summary.byChief.size === 0 ? (
            <p className="text-gray-400">{t("productionHistory.noLogsYet")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {[...summary.byChief.entries()].map(([name, count]) => (
                <li key={name} className="flex justify-between gap-4">
                  <span>{name}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 lg:col-span-1">
          <h3 className="mb-3 font-semibold">{t("productionHistory.byPlate")}</h3>
          {summary.byPlate.size === 0 ? (
            <p className="text-sm text-gray-500">{t("productionHistory.noProductionLogged")}</p>
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
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto lg:col-span-3">
          <h3 className="mb-4 font-semibold">{t("productionHistory.productionLog")}</h3>
          {logs.length === 0 ? (
            <p className="text-gray-500">{t("productionHistory.noPlatesLogged")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                  <th className="pb-3 pe-4">{tCommon("fields.date")}</th>
                  <th className="pb-3 pe-4">{tCommon("fields.chief")}</th>
                  <th className="pb-3 pe-4">{tCommon("fields.plate")}</th>
                  <th className="pb-3 pe-4">{tCommon("fields.weightKg")}</th>
                  <th className="pb-3">{tCommon("fields.notes")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 pe-4 whitespace-nowrap">
                      {formatShortDate(log.logged_at)}
                      <span className="block text-xs text-gray-400">
                        {formatTime(log.logged_at)}
                      </span>
                    </td>
                    <td className="py-3 pe-4">
                      {log.chief?.name ?? tCommon("emDash")}
                      {log.chief?.short_id && (
                        <span className="block text-xs text-gray-400">
                          {tCommon("idShort", { id: log.chief.short_id })}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pe-4">{log.dish?.name ?? tCommon("emDash")}</td>
                    <td className="py-3 pe-4">
                      {formatNumber(
                        plateWeightToKg(
                          log.plate_weight_grams ?? log.dish?.plate_weight_grams
                        )
                      )}
                    </td>
                    <td className="py-3 text-gray-500">{log.notes || tCommon("emDash")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
