import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { DailySalesOverview } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatTime } from "../../utils/formatDate";
import { paymentMethodLabel, weightTypeLabel } from "../../utils/purchaseStatus";

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
    <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-brand-500">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count?: string | number;
  children: ReactNode;
}) {
  return (
    <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="font-semibold">{title}</h3>
        {count !== undefined && (
          <span className="text-sm text-gray-500">{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title={t("sales.totalRevenue")} value={formatCurrency(summary.total_revenue)} />
        <StatCard title={t("paymentMethods.cash")} value={formatCurrency(summary.payments.cash)} />
        <StatCard title={t("paymentMethods.cbe")} value={formatCurrency(summary.payments.cbe)} />
        <StatCard title={t("paymentMethods.telebirr")} value={formatCurrency(summary.payments.telebirr)} />
        <StatCard title={t("paymentMethods.other")} value={formatCurrency(summary.payments.other)} />
        <StatCard
          title={t("sales.salesCount")}
          value={String(summary.sale_count)}
          subtitle={t("units.kgSold", { amount: formatNumber(summary.kilo_sold) })}
        />
      </div>

      <SectionCard
        title={t("sales.plateStock")}
        count={t("units.plates", { count: data.by_dish.length })}
      >
        {data.by_dish.length === 0 ? (
          <p className="text-gray-500">{t("sales.noProductionOrSales")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pe-4">{t("fields.plate")}</th>
                <th className="pb-3 pe-4">{t("sales.producedKg")}</th>
                <th className="pb-3 pe-4">{t("sales.platesCooked")}</th>
                <th className="pb-3 pe-4">{t("sales.soldKgCol")}</th>
                <th className="pb-3 pe-4">{t("sales.remainingKg")}</th>
                <th className="pb-3 pe-4">{t("sales.revenue")}</th>
                <th className="pb-3">{t("sales.sales")}</th>
              </tr>
            </thead>
            <tbody>
              {data.by_dish.map((row) => (
                <tr
                  key={row.dish_id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 pe-4 font-medium">{row.dish_name}</td>
                  <td className="py-3 pe-4">{formatNumber(row.produced_kg)}</td>
                  <td className="py-3 pe-4">{row.produced_plates}</td>
                  <td className="py-3 pe-4">{formatNumber(row.sold_kg)}</td>
                  <td className="py-3 pe-4 font-medium text-brand-600">
                    {formatNumber(row.remaining_kg)}
                  </td>
                  <td className="py-3 pe-4">{formatCurrency(row.revenue)}</td>
                  <td className="py-3">{row.sale_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* {data.by_seller.length > 0 && (
        <SectionCard title={t("sales.bySeller")} count={`${data.by_seller.length} sellers`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pe-4">{t("fields.seller")}</th>
                <th className="pb-3 pe-4">{t("fields.role")}</th>
                <th className="pb-3 pe-4">{t("sales.sales")}</th>
                <th className="pb-3 pe-4">{t("units.kgAbbr")}</th>
                <th className="pb-3">{t("sales.revenue")}</th>
              </tr>
            </thead>
            <tbody>
              {data.by_seller.map((row) => (
                <tr
                  key={row.seller_id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 pe-4">{row.seller_name}</td>
                  <td className="py-3 pe-4">
                    {row.role ? getRoleLabel(row.role) : t("emDash")}
                  </td>
                  <td className="py-3 pe-4">{row.sale_count}</td>
                  <td className="py-3 pe-4">{formatNumber(row.kilo_sold)}</td>
                  <td className="py-3">{formatCurrency(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )} */}

      <SectionCard
        title={t("sales.allSales")}
        count={t("sales.transactions", { count: data.sales.length })}
      >
        {data.sales.length === 0 ? (
          <p className="text-gray-500">{t("sales.noSalesRecorded")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pe-4">{t("fields.time")}</th>
                <th className="pb-3 pe-4">{t("fields.seller")}</th>
                <th className="pb-3 pe-4">{t("fields.plate")}</th>
                <th className="pb-3 pe-4">{t("sales.portion")}</th>
                <th className="pb-3 pe-4">{t("sales.kgUsed")}</th>
                <th className="pb-3 pe-4">{t("fields.payment")}</th>
                <th className="pb-3">{t("fields.total")}</th>
              </tr>
            </thead>
            <tbody>
              {data.sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 pe-4 whitespace-nowrap">
                    {formatTime(sale.sold_at)}
                  </td>
                  <td className="py-3 pe-4">{sale.seller?.name ?? t("emDash")}</td>
                  <td className="py-3 pe-4">{sale.dish?.name ?? t("emDash")}</td>
                  <td className="py-3 pe-4">
                    {formatPortion(sale.weight_type, sale.slice_count, sale.quantity)}
                  </td>
                  <td className="py-3 pe-4">{formatNumber(sale.kilo_consumed)}</td>
                  <td className="py-3 pe-4">
                    {paymentMethodLabel(sale.payment_method)}
                  </td>
                  <td className="py-3 font-medium">
                    {formatCurrency(parseFloat(String(sale.total_price)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
