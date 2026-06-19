import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import { api, type ProductionLog, type Purchase } from "../../services/api";
import { formatShortDate } from "../../utils/formatDate";
import { formatNumber } from "../../utils/formatNumber";
import { plateWeightToKg } from "../../utils/plateWeight";

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-gray-500">{count} today</span>
      </div>
      {children}
    </div>
  );
}

export default function ChiefTodayPage() {
  const [production, setProduction] = useState<ProductionLog[]>([]);
  const [receipts, setReceipts] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      api.get<ProductionLog[]>("/stock/production?period=today"),
      api.get<Purchase[]>("/purchases?period=today&date_field=received_at"),
    ])
      .then(([productionData, receiptsData]) => {
        setProduction(productionData);
        setReceipts(receiptsData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageMeta title="Chief Today | Restaurant" description="Today's chief activity" />
      <PageBreadcrumb pageTitle="Chief — Today's Activity" />
      <p className="mb-4 text-sm text-gray-500">{todayLabel}</p>
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Loading today's activity...</p>
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500">Total events today</p>
            <p className="mt-1 text-3xl font-bold text-brand-500">
              {production.length + receipts.length}
            </p>
          </div>

          <SectionCard title="Plates Cooked" count={production.length}>
            {production.length === 0 ? (
              <p className="text-gray-500">No plates cooked today</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                    <th className="pb-3 pr-4">Time</th>
                    <th className="pb-3 pr-4">Chief</th>
                    <th className="pb-3 pr-4">Plate</th>
                    <th className="pb-3 pr-4">Weight (kg)</th>
                    <th className="pb-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {production.map((log) => (
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
                          <span className="block text-xs text-gray-400">
                            #{log.chief.short_id}
                          </span>
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
          </SectionCard>

          <SectionCard title="Receipts Confirmed" count={receipts.length}>
            {receipts.length === 0 ? (
              <p className="text-gray-500">No receipts confirmed today</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                    <th className="pb-3 pr-4">Time</th>
                    <th className="pb-3 pr-4">ID</th>
                    <th className="pb-3 pr-4">Chief</th>
                    <th className="pb-3 pr-4">From</th>
                    <th className="pb-3 pr-4">Ingredient</th>
                    <th className="pb-3 pr-4">Qty</th>
                    <th className="pb-3 pr-4">Total</th>
                    <th className="pb-3">Screenshot</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-gray-100 dark:border-gray-800 align-middle"
                    >
                      <td className="py-4 pr-4 whitespace-nowrap">
                        {formatShortDate(p.received_at ?? undefined)}
                      </td>
                      <td className="py-4 pr-4 font-medium">#{p.id}</td>
                      <td className="py-4 pr-4">{p.chief?.name ?? "—"}</td>
                      <td className="py-4 pr-4">{p.purchaser?.name ?? "—"}</td>
                      <td className="py-4 pr-4">{p.ingredient?.name}</td>
                      <td className="py-4 pr-4 whitespace-nowrap">
                        {formatNumber(p.quantity)} {p.ingredient?.unit}
                      </td>
                      <td className="py-4 pr-4 font-medium whitespace-nowrap">
                        ETB {p.total_price}
                      </td>
                      <td className="py-4">
                        <PurchaseScreenshot
                          purchaseId={p.id}
                          hasScreenshot={!!p.screenshot_path}
                          width={56}
                          height={56}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}
