import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import {
  DataTable,
  SectionCard,
  StatCard,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { getIntlLocale } from "../../i18n";
import { api, type ProductionLog, type Purchase } from "../../services/api";
import { formatShortDate, formatTime } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { plateWeightToKg } from "../../utils/plateWeight";
import { translateApiError } from "../../utils/translateApiError";

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

  const productionColumns: DataTableColumn<ProductionLog>[] = useMemo(
    () => [
      {
        key: "time",
        header: tCommon("fields.time"),
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

  const receiptColumns: DataTableColumn<Purchase>[] = useMemo(
    () => [
      {
        key: "time",
        header: tCommon("fields.time"),
        cellClassName: "whitespace-nowrap",
        render: (p) => formatShortDate(p.received_at ?? undefined),
      },
      {
        key: "id",
        header: tCommon("fields.id"),
        render: (p) => (
          <span className="font-medium text-gray-800 dark:text-white/90">
            {tCommon("idShort", { id: p.id })}
          </span>
        ),
      },
      {
        key: "chief",
        header: tCommon("fields.chief"),
        render: (p) => p.chief?.name ?? tCommon("emDash"),
      },
      {
        key: "from",
        header: tCommon("fields.from"),
        render: (p) => p.purchaser?.name ?? tCommon("emDash"),
      },
      {
        key: "ingredient",
        header: tCommon("fields.ingredient"),
        render: (p) => p.ingredient?.name ?? tCommon("emDash"),
      },
      {
        key: "qty",
        header: tCommon("fields.qty"),
        cellClassName: "whitespace-nowrap",
        render: (p) => `${formatNumber(p.quantity)} ${p.ingredient?.unit ?? ""}`,
      },
      {
        key: "total",
        header: tCommon("fields.total"),
        cellClassName: "whitespace-nowrap font-medium",
        render: (p) => formatCurrency(parseFloat(String(p.total_price))),
      },
      {
        key: "screenshot",
        header: tCommon("fields.screenshot"),
        render: (p) => (
          <PurchaseScreenshot
            purchaseId={p.id}
            hasScreenshot={!!p.screenshot_path}
            width={56}
            height={56}
          />
        ),
      },
    ],
    [tCommon]
  );

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
      <PageBreadcrumb pageTitle={tNav("chiefTodayTitle")} subtitle={todayLabel} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{tCommon("loadingTodayActivity")}</p>
      ) : (
        <div className="space-y-6">
          <StatCard
            title={tCommon("totalPlatesToday")}
            value={String(production.length + receipts.length)}
            accent="success"
          />

          <SectionCard
            title={t("chiefToday.platesCooked")}
            count={tCommon("todayCount", { count: production.length })}
          >
            <DataTable
              columns={productionColumns}
              data={production}
              keyExtractor={(log) => log.id}
              emptyMessage={t("chiefToday.noPlatesCooked")}
              hoverRows
            />
          </SectionCard>

          <SectionCard
            title={t("chiefToday.receiptsConfirmed")}
            count={tCommon("todayCount", { count: receipts.length })}
          >
            <DataTable
              columns={receiptColumns}
              data={receipts}
              keyExtractor={(p) => p.id}
              emptyMessage={t("chiefToday.noReceiptsConfirmed")}
              hoverRows
            />
          </SectionCard>
        </div>
      )}
    </div>
  );
}
