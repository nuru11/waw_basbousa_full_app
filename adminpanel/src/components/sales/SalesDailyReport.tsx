import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  DataTable,
  paymentMethodVariant,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import type { DailySalesOverview } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatTime } from "../../utils/formatDate";
import {
  paymentMethodLabel,
  weightTypeLabel,
} from "../../utils/purchaseStatus";
import { PAYMENT_OPTIONS, type PaymentMethod } from "../../utils/paymentMethods";
import type { StatCardAccent } from "../../components/ui/stat-card/StatCard";

const PAYMENT_STAT_ACCENTS: Record<PaymentMethod, StatCardAccent> = {
  cash: "success",
  cbe: "brand",
  telebirr: "info",
  awash: "error",
  dashen: "brand",
  abyssinia: "success",
  nib: "info",
  coop: "orange",
  other: "neutral",
};

interface SalesDailyReportProps {
  data: DailySalesOverview;
}

export default function SalesDailyReport({ data }: SalesDailyReportProps) {
  const { t } = useTranslation("common");
  const { summary } = data;

  function formatPortion(
    weightType: string,
    sliceCount: number | null,
    quantity: number
  ) {
    const label =
      weightType === "slice" && sliceCount
        ? t("units.slices", { count: sliceCount })
        : weightTypeLabel(weightType);
    if (quantity > 1) {
      return `${label} × ${quantity}`;
    }
    return label;
  }

  const salesColumns: DataTableColumn<DailySalesOverview["sales"][number]>[] =
    useMemo(
      () => [
        {
          key: "time",
          header: t("fields.time"),
          cellClassName: "whitespace-nowrap",
          render: (sale) => formatTime(sale.sold_at),
        },
        {
          key: "seller",
          header: t("fields.seller"),
          render: (sale) => sale.seller?.name ?? t("emDash"),
        },
        {
          key: "plate",
          header: t("fields.plate"),
          render: (sale) => sale.dish?.name ?? t("emDash"),
        },
        {
          key: "portion",
          header: t("sales.portion"),
          render: (sale) =>
            formatPortion(sale.weight_type, sale.slice_count, sale.quantity),
        },
        {
          key: "kgUsed",
          header: t("sales.kgUsed"),
          render: (sale) => formatNumber(sale.kilo_consumed),
        },
        {
          key: "payment",
          header: t("fields.payment"),
          render: (sale) => (
            <StatusBadge variant={paymentMethodVariant(sale.payment_method)}>
              {paymentMethodLabel(sale.payment_method)}
            </StatusBadge>
          ),
        },
        {
          key: "total",
          header: t("fields.total"),
          render: (sale) => (
            <span className="font-medium text-gray-800 dark:text-white/90">
              {formatCurrency(parseFloat(String(sale.total_price)))}
            </span>
          ),
        },
      ],
      [t]
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t("sales.totalKilo")}
          value={formatNumber(summary.plate_pool.produced_kg)}
          accent="neutral"
        />
        <StatCard
          title={t("sales.totalKiloSold")}
          value={formatNumber(summary.plate_pool.sold_kg)}
          accent="orange"
        />
        <StatCard
          title={t("sales.remainingKg")}
          value={formatNumber(summary.plate_pool.remaining_kg)}
          accent="brand"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title={t("sales.totalRevenue")}
          value={formatCurrency(summary.total_revenue)}
          accent="brand"
        />
        {PAYMENT_OPTIONS.map((method) => (
          <StatCard
            key={method}
            title={t(`paymentMethods.${method}`)}
            value={formatCurrency(summary.payments[method] ?? 0)}
            accent={PAYMENT_STAT_ACCENTS[method]}
          />
        ))}
        <StatCard
          title={t("sales.salesCount")}
          value={String(summary.sale_count)}
          subtitle={t("units.kgSold", { amount: formatNumber(summary.kilo_sold) })}
          accent="orange"
        />
      </div>

      {/* <SectionCard
        title={t("sales.plateStock")}
        count={t("units.plates", { count: data.by_dish.length })}
      >
        <DataTable
          columns={dishColumns}
          data={data.by_dish}
          keyExtractor={(row) => row.dish_id}
          emptyMessage={t("sales.noProductionOrSales")}
        />
      </SectionCard> */}

      <SectionCard
        title={t("sales.allSales")}
        count={t("sales.transactions", { count: data.sales.length })}
      >
        <DataTable
          columns={salesColumns}
          data={data.sales}
          keyExtractor={(sale) => sale.id}
          emptyMessage={t("sales.noSalesRecorded")}
          hoverRows
        />
      </SectionCard>
    </div>
  );
}
