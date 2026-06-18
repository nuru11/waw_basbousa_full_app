import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { api, type Purchase, type Sale } from "../../services/api";

export default function ReportsPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    api.get<Purchase[]>("/reports/purchases").then(setPurchases);
    api.get<Sale[]>("/reports/sales").then(setSales);
  }, []);

  const fmt = (n: string | number) =>
    new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(
      parseFloat(String(n))
    );

  return (
    <div>
      <PageMeta title="Reports | Restaurant" description="Financial reports" />
      <PageBreadcrumb pageTitle="Reports" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
          <h3 className="mb-4 font-semibold">Purchases (Expenses)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-2">ID</th>
                <th className="pb-2">Item</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2">Unit Price</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2">#{p.id}</td>
                  <td className="py-2">{p.ingredient?.name}</td>
                  <td className="py-2">{p.quantity}</td>
                  <td className="py-2">{fmt(p.unit_price)}</td>
                  <td className="py-2">{fmt(p.total_price)}</td>
                  <td className="py-2 capitalize">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
          <h3 className="mb-4 font-semibold">Sales (Income)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-2">Dish</th>
                <th className="pb-2">Seller</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2">{s.dish?.name}</td>
                  <td className="py-2">{s.employee?.name}</td>
                  <td className="py-2 capitalize">{s.weight_type}</td>
                  <td className="py-2">{fmt(s.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
