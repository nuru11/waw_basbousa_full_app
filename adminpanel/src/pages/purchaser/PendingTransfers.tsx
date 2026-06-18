import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { api, type Transfer } from "../../services/api";
import { formatRelativeDate, formatShortDate } from "../../utils/formatDate";

function formatEtb(value: number | string) {
  return parseFloat(String(value)).toFixed(2);
}

function getTransferDateStr(transfer: Transfer) {
  return transfer.createdAt ?? transfer.created_at;
}

export default function PendingTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get<Transfer[]>("/transfers?status=pending")
      .then(setTransfers)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function handleAccept(id: number) {
    setLoading(id);
    setError("");
    try {
      await api.post(`/transfers/${id}/accept`, {});
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <PageMeta title="Pending Transfers | Restaurant" description="Accept incoming transfers" />
      <PageBreadcrumb pageTitle="Pending Transfers" />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <h3 className="mb-4 font-semibold">Transfers Awaiting Acceptance</h3>
       
        {transfers.length === 0 ? (
          <p className="text-gray-500">No pending transfers</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pr-4">When</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">From</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => {
                const dateStr = getTransferDateStr(t);
                return (
                  <tr
                    key={t.id}
                    className="border-b border-gray-100 dark:border-gray-800 align-middle"
                  >
                    <td className="py-4 pr-4">{formatRelativeDate(dateStr)}</td>
                    <td className="py-4 pr-4">{formatShortDate(dateStr)}</td>
                    <td className="py-4 pr-4">{t.creator?.name ?? "SuperAdmin"}</td>
                    <td className="py-4 pr-4 font-medium whitespace-nowrap">
                      ETB {formatEtb(t.amount)}
                    </td>
                    <td className="py-4">
                      <Button
                        size="sm"
                        disabled={loading === t.id}
                        onClick={() => handleAccept(t.id)}
                      >
                        {loading === t.id ? "Accepting..." : "Accept"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
