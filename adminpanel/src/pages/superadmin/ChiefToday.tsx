import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import { getIntlLocale } from "../../i18n";
import { api, type ProductionLog, type Purchase } from "../../services/api";
import { formatShortDate, formatTime } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { plateWeightToKg } from "../../utils/plateWeight";
import { translateApiError } from "../../utils/translateApiError";

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { t: tCommon } = useTranslation("common");

  return (
    <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-gray-500">{tCommon("todayCount", { count })}</span>
      </div>
      {children}
    </div>
  );
}

export default function ChiefTodayPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [production, setProduction] = useState<ProductionLog[]>([]);
  const [receipts, setReceipts] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const todayLabel = new Date().toLocaleDateString(getIntlLocale(), {
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
      .catch((e) => setError(translateApiError(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageMeta title={t("chiefToday.metaTitle")} description={t("chiefToday.metaDescription")} />
      <PageBreadcrumb pageTitle={tNav("chiefTodayTitle")} />
      <p className="mb-4 text-sm text-gray-500">{todayLabel}</p>
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500">{tCommon("loadingTodayActivity")}</p>
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500">{tCommon("totalEventsToday")}</p>
            <p className="mt-1 text-3xl font-bold text-brand-500">
              {production.length + receipts.length}
            </p>
          </div>

          <SectionCard title={t("chiefToday.platesCooked")} count={production.length}>
            {production.length === 0 ? (
              <p className="text-gray-500">{t("chiefToday.noPlatesCooked")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                    <th className="pb-3 pe-4">{tCommon("fields.time")}</th>
                    <th className="pb-3 pe-4">{tCommon("fields.chief")}</th>
                    <th className="pb-3 pe-4">{tCommon("fields.plate")}</th>
                    <th className="pb-3 pe-4">{tCommon("fields.weightKg")}</th>
                    <th className="pb-3">{tCommon("fields.notes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {production.map((log) => (
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
          </SectionCard>

          <SectionCard title={t("chiefToday.receiptsConfirmed")} count={receipts.length}>
            {receipts.length === 0 ? (
              <p className="text-gray-500">{t("chiefToday.noReceiptsConfirmed")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                    <th className="pb-3 pe-4">{tCommon("fields.time")}</th>
                    <th className="pb-3 pe-4">{tCommon("fields.id")}</th>
                    <th className="pb-3 pe-4">{tCommon("fields.chief")}</th>
                    <th className="pb-3 pe-4">{tCommon("fields.from")}</th>
                    <th className="pb-3 pe-4">{tCommon("fields.ingredient")}</th>
                    <th className="pb-3 pe-4">{tCommon("fields.qty")}</th>
                    <th className="pb-3 pe-4">{tCommon("fields.total")}</th>
                    <th className="pb-3">{tCommon("fields.screenshot")}</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-gray-100 dark:border-gray-800 align-middle"
                    >
                      <td className="py-4 pe-4 whitespace-nowrap">
                        {formatShortDate(p.received_at ?? undefined)}
                      </td>
                      <td className="py-4 pe-4 font-medium">{tCommon("idShort", { id: p.id })}</td>
                      <td className="py-4 pe-4">{p.chief?.name ?? tCommon("emDash")}</td>
                      <td className="py-4 pe-4">{p.purchaser?.name ?? tCommon("emDash")}</td>
                      <td className="py-4 pe-4">{p.ingredient?.name}</td>
                      <td className="py-4 pe-4 whitespace-nowrap">
                        {formatNumber(p.quantity)} {p.ingredient?.unit}
                      </td>
                      <td className="py-4 pe-4 font-medium whitespace-nowrap">
                        {formatCurrency(parseFloat(String(p.total_price)))}
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
