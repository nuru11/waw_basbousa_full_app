import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { api, type Sale } from "../../services/api";

export default function MySalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    api.get<Sale[]>("/sales/mine").then(setSales);
  }, []);

  const total = sales.reduce((sum, s) => sum + parseFloat(String(s.total_price)), 0);

  return (
    <div>
      <PageMeta title="My Sales | Restaurant" description="Sales history" />
      <PageBreadcrumb pageTitle="My Sales" />
      <p className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Total sold: ETB {total.toFixed(2)}
      </p>
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b dark:border-gray-700">
              <th className="pb-3">Dish</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Qty</th>
              <th className="pb-3">Payment</th>
              <th className="pb-3">Total</th>
              <th className="pb-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3">{s.dish?.name}</td>
                <td className="py-3 capitalize">
                  {s.weight_type}
                  {s.slice_count ? ` (${s.slice_count} slices)` : ""}
                </td>
                <td className="py-3">{s.quantity}</td>
                <td className="py-3 uppercase">{s.payment_method}</td>
                <td className="py-3">ETB {s.total_price}</td>
                <td className="py-3">{new Date(s.sold_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
