import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { api, type Purchase } from "../../services/api";

export default function PendingReceiptsPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<number | null>(null);

  const load = () =>
    api.get<Purchase[]>("/purchases?status=handed").then(setPurchases);

  useEffect(() => {
    load();
  }, []);

  async function handleReceive(id: number) {
    setLoading(id);
    try {
      await api.post(`/purchases/${id}/receive`, {});
      load();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <PageMeta title="Pending Receipts | Restaurant" description="Receive purchases" />
      <PageBreadcrumb pageTitle="Pending Receipts" />
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
        {purchases.length === 0 ? (
          <p className="text-gray-500">No purchases handed to you awaiting receipt</p>
        ) : (
          <div className="space-y-4">
            {purchases.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03]"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    Purchase #{p.id}
                  </p>
                  <p className="text-sm text-gray-500">
                    {p.ingredient?.name} — {p.quantity} {p.ingredient?.unit}
                  </p>
                  <p className="text-sm text-gray-500">
                    From: {p.purchaser?.name} | Total: ETB {p.total_price}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleReceive(p.id)}
                  disabled={loading === p.id}
                >
                  {loading === p.id ? "Receiving..." : "I Received"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
