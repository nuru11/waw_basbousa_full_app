import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { api, type Purchase } from "../../services/api";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import { formatNumber } from "../../utils/formatNumber";

export default function PendingPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get<Purchase[]>("/purchases?status=pending")
      .then(setPurchases)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: number) {
    setLoading(id);
    setError("");
    try {
      await api.post(`/purchases/${id}/approve`, {});
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <PageMeta title="Pending Purchases | Restaurant" description="Approve purchases" />
      <PageBreadcrumb pageTitle="Pending Purchases" />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <h3 className="mb-4 font-semibold">Pending Purchases</h3>
        {purchases.length === 0 ? (
          <p className="text-gray-500">No pending purchases</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Purchaser</th>
                <th className="pb-3 pr-4">Ingredient</th>
                <th className="pb-3 pr-4">Qty</th>
                <th className="pb-3 pr-4">Unit Price</th>
                <th className="pb-3 pr-4">Total</th>
                <th className="pb-3 pr-4">Screenshot</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-100 dark:border-gray-800 align-middle"
                >
                  <td className="py-4 pr-4 font-medium text-gray-800 dark:text-white/90">
                    #{p.id}
                  </td>
                  <td className="py-4 pr-4">{p.purchaser?.name}</td>
                  <td className="py-4 pr-4">{p.ingredient?.name}</td>
                  <td className="py-4 pr-4 whitespace-nowrap">
                    {formatNumber(p.quantity)} {p.ingredient?.unit}
                  </td>
                  <td className="py-4 pr-4 whitespace-nowrap">ETB {p.unit_price}</td>
                  <td className="py-4 pr-4 font-medium whitespace-nowrap">
                    ETB {p.total_price}
                  </td>
                  <td className="py-4 pr-4">
                    <PurchaseScreenshot
                      purchaseId={p.id}
                      hasScreenshot={!!p.screenshot_path}
                      width={72}
                      height={72}
                    />
                  </td>
                  <td className="py-4">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(p.id)}
                      disabled={loading === p.id}
                    >
                      {loading === p.id ? "Accepting..." : "Accept"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
