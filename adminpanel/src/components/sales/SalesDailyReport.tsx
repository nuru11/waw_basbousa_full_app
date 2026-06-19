import type { DailySalesOverview } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";
import { ROLE_LABELS } from "../../utils/roleRoutes";

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(n);
}

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
  children: React.ReactNode;
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

function formatPortion(
  weightType: string,
  sliceCount: number | null,
  quantity: number
) {
  let label = weightType;
  if (weightType === "slice" && sliceCount) {
    label = `${sliceCount} slice${sliceCount === 1 ? "" : "s"}`;
  }
  if (quantity > 1) {
    return `${label} × ${quantity}`;
  }
  return label;
}

interface SalesDailyReportProps {
  data: DailySalesOverview;
}

export default function SalesDailyReport({ data }: SalesDailyReportProps) {
  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Revenue" value={fmtCurrency(summary.total_revenue)} />
        <StatCard title="Cash" value={fmtCurrency(summary.payments.cash)} />
        <StatCard title="CBE" value={fmtCurrency(summary.payments.cbe)} />
        <StatCard title="Telebirr" value={fmtCurrency(summary.payments.telebirr)} />
        <StatCard title="Other" value={fmtCurrency(summary.payments.other)} />
        <StatCard
          title="Sales Count"
          value={String(summary.sale_count)}
          subtitle={`${formatNumber(summary.kilo_sold)} kg sold`}
        />
      </div>

      <SectionCard
        title="Plate stock"
        count={`${data.by_dish.length} plate${data.by_dish.length === 1 ? "" : "s"}`}
      >
        {data.by_dish.length === 0 ? (
          <p className="text-gray-500">No production or sales for this day</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pr-4">Plate</th>
                <th className="pb-3 pr-4">Produced (kg)</th>
                <th className="pb-3 pr-4">Plates cooked</th>
                <th className="pb-3 pr-4">Sold (kg)</th>
                <th className="pb-3 pr-4">Remaining (kg)</th>
                <th className="pb-3 pr-4">Revenue</th>
                <th className="pb-3">Sales</th>
              </tr>
            </thead>
            <tbody>
              {data.by_dish.map((row) => (
                <tr
                  key={row.dish_id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 pr-4 font-medium">{row.dish_name}</td>
                  <td className="py-3 pr-4">{formatNumber(row.produced_kg)}</td>
                  <td className="py-3 pr-4">{row.produced_plates}</td>
                  <td className="py-3 pr-4">{formatNumber(row.sold_kg)}</td>
                  <td className="py-3 pr-4 font-medium text-brand-600">
                    {formatNumber(row.remaining_kg)}
                  </td>
                  <td className="py-3 pr-4">{fmtCurrency(row.revenue)}</td>
                  <td className="py-3">{row.sale_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* {data.by_seller.length > 0 && (
        <SectionCard title="By seller" count={`${data.by_seller.length} sellers`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pr-4">Seller</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Sales</th>
                <th className="pb-3 pr-4">Kg sold</th>
                <th className="pb-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.by_seller.map((row) => (
                <tr
                  key={row.seller_id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 pr-4">{row.seller_name}</td>
                  <td className="py-3 pr-4">
                    {row.role ? ROLE_LABELS[row.role] : "—"}
                  </td>
                  <td className="py-3 pr-4">{row.sale_count}</td>
                  <td className="py-3 pr-4">{formatNumber(row.kilo_sold)}</td>
                  <td className="py-3">{fmtCurrency(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )} */}

      <SectionCard title="All sales" count={`${data.sales.length} transactions`}>
        {data.sales.length === 0 ? (
          <p className="text-gray-500">No sales recorded for this day</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pr-4">Time</th>
                <th className="pb-3 pr-4">Seller</th>
                <th className="pb-3 pr-4">Plate</th>
                <th className="pb-3 pr-4">Portion</th>
                <th className="pb-3 pr-4">Kg used</th>
                <th className="pb-3 pr-4">Payment</th>
                <th className="pb-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {new Date(sale.sold_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3 pr-4">{sale.seller?.name ?? "—"}</td>
                  <td className="py-3 pr-4">{sale.dish?.name ?? "—"}</td>
                  <td className="py-3 pr-4 capitalize">
                    {formatPortion(sale.weight_type, sale.slice_count, sale.quantity)}
                  </td>
                  <td className="py-3 pr-4">{formatNumber(sale.kilo_consumed)}</td>
                  <td className="py-3 pr-4 uppercase">{sale.payment_method}</td>
                  <td className="py-3 font-medium">{fmtCurrency(parseFloat(String(sale.total_price)))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
