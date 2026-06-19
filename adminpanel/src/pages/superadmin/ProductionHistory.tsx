import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { api, type ProductionLog } from "../../services/api";
import { formatShortDate } from "../../utils/formatDate";
import { formatNumber } from "../../utils/formatNumber";
import { plateWeightToKg } from "../../utils/plateWeight";

export default function ProductionHistoryPage() {
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ProductionLog[]>("/stock/production")
      .then(setLogs)
      .catch((e) => setError(e.message));
  }, []);

  const summary = useMemo(() => {
    const totalPlates = logs.reduce((sum, log) => sum + log.plates_count, 0);
    const byPlate = new Map<string, number>();
    const byChief = new Map<string, number>();

    for (const log of logs) {
      const plateName = log.dish?.name ?? `Plate #${log.dish_id}`;
      const chiefName = log.chief?.name ?? "Unknown chief";
      byPlate.set(plateName, (byPlate.get(plateName) ?? 0) + log.plates_count);
      byChief.set(chiefName, (byChief.get(chiefName) ?? 0) + log.plates_count);
    }

    return { totalPlates, byPlate, byChief };
  }, [logs]);

  return (
    <div>
      <PageMeta title="Production History | Restaurant" description="Chief production logs" />
      <PageBreadcrumb pageTitle="Plates Made by Chief" />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500">Total Plates Made</p>
          <p className="mt-1 text-3xl font-bold text-brand-500">{summary.totalPlates}</p>
        </div>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500">Production Entries</p>
          <p className="mt-1 text-3xl font-bold text-gray-800 dark:text-white/90">{logs.length}</p>
        </div>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="mb-2 text-sm text-gray-500">By Chief</p>
          {summary.byChief.size === 0 ? (
            <p className="text-gray-400">No logs yet</p>
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
          <h3 className="mb-3 font-semibold">By Plate</h3>
          {summary.byPlate.size === 0 ? (
            <p className="text-sm text-gray-500">No production logged yet</p>
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
          <h3 className="mb-4 font-semibold">Production Log</h3>
          {logs.length === 0 ? (
            <p className="text-gray-500">No plates logged by chief yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Chief</th>
                  <th className="pb-3 pr-4">Plate</th>
                  <th className="pb-3 pr-4">Weight (kg)</th>
                  <th className="pb-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatShortDate(log.logged_at)}
                      <span className="block text-xs text-gray-400">
                        {new Date(log.logged_at).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {log.chief?.name ?? "—"}
                      {log.chief?.short_id && (
                        <span className="block text-xs text-gray-400">#{log.chief.short_id}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{log.dish?.name ?? "—"}</td>
                    <td className="py-3 pr-4">
                      {formatNumber(
                        plateWeightToKg(
                          log.plate_weight_grams ?? log.dish?.plate_weight_grams
                        )
                      )}
                    </td>
                    <td className="py-3 text-gray-500">{log.notes || "—"}</td>
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
