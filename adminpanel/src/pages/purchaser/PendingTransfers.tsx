import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { api, type Transfer } from "../../services/api";
import { formatRelativeDate, formatShortDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import { translateApiError } from "../../utils/translateApiError";

function getTransferDateStr(transfer: Transfer) {
  return transfer.createdAt ?? transfer.created_at;
}

export default function PendingTransfersPage() {
  const { t } = useTranslation(["purchaser", "common", "nav"]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get<Transfer[]>("/transfers?status=pending")
      .then(setTransfers)
      .catch((e) => setError(translateApiError(e)));

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
      setError(translateApiError(err, "purchaser:pendingTransfers.failedToAccept"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <PageMeta
        title={t("pendingTransfers.metaTitle")}
        description={t("pendingTransfers.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:pendingTransfers")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <h3 className="mb-4 font-semibold">{t("pendingTransfers.awaitingAcceptance")}</h3>

        {transfers.length === 0 ? (
          <p className="text-gray-500">{t("pendingTransfers.empty")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pe-4">{t("common:fields.when")}</th>
                <th className="pb-3 pe-4">{t("common:fields.date")}</th>
                <th className="pb-3 pe-4">{t("common:fields.from")}</th>
                <th className="pb-3 pe-4">{t("common:fields.amount")}</th>
                <th className="pb-3">{t("common:fields.action")}</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((tr) => {
                const dateStr = getTransferDateStr(tr);
                return (
                  <tr
                    key={tr.id}
                    className="border-b border-gray-100 dark:border-gray-800 align-middle"
                  >
                    <td className="py-4 pe-4">{formatRelativeDate(dateStr)}</td>
                    <td className="py-4 pe-4">{formatShortDate(dateStr)}</td>
                    <td className="py-4 pe-4">{tr.creator?.name ?? t("common:superAdmin")}</td>
                    <td className="py-4 pe-4 font-medium whitespace-nowrap">
                      {formatCurrency(parseFloat(String(tr.amount)))}
                    </td>
                    <td className="py-4">
                      <Button
                        size="sm"
                        disabled={loading === tr.id}
                        onClick={() => handleAccept(tr.id)}
                      >
                        {loading === tr.id
                          ? t("common:actions.accepting")
                          : t("common:actions.accept")}
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
