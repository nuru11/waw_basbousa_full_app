import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import Button from "../../components/ui/button/Button";
import { api, type Purchase } from "../../services/api";
import { formatRelativeDate, formatShortDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { translateApiError } from "../../utils/translateApiError";

export default function PendingReceiptsPage() {
  const { t } = useTranslation(["chief", "common", "nav"]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get<Purchase[]>("/purchases?status=handed")
      .then(setPurchases)
      .catch((e) => setError(translateApiError(e)));

  useEffect(() => {
    load();
  }, []);

  async function handleReceive(id: number) {
    setLoading(id);
    setError("");
    try {
      await api.post(`/purchases/${id}/receive`, {});
      load();
    } catch (err: unknown) {
      setError(translateApiError(err, "chief:pendingReceipts.failedToConfirm"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <PageMeta
        title={t("pendingReceipts.metaTitle")}
        description={t("pendingReceipts.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:pendingReceipts")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <h3 className="mb-4 font-semibold">{t("pendingReceipts.awaitingReceipt")}</h3>
        {purchases.length === 0 ? (
          <p className="text-gray-500">{t("pendingReceipts.empty")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pe-4">{t("common:fields.id")}</th>
                <th className="pb-3 pe-4">{t("common:fields.when")}</th>
                <th className="pb-3 pe-4">{t("common:fields.date")}</th>
                <th className="pb-3 pe-4">{t("common:fields.from")}</th>
                <th className="pb-3 pe-4">{t("common:fields.ingredient")}</th>
                <th className="pb-3 pe-4">{t("common:fields.qty")}</th>
                <th className="pb-3 pe-4">{t("common:fields.total")}</th>
                <th className="pb-3 pe-4">{t("common:fields.receipt")}</th>
                <th className="pb-3">{t("common:fields.action")}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-100 dark:border-gray-800 align-middle"
                >
                  <td className="py-4 pe-4 font-medium text-gray-800 dark:text-white/90">
                    {t("common:idShort", { id: p.id })}
                  </td>
                  <td className="py-4 pe-4">{formatRelativeDate(p.handed_at ?? undefined)}</td>
                  <td className="py-4 pe-4">{formatShortDate(p.handed_at ?? undefined)}</td>
                  <td className="py-4 pe-4">{p.purchaser?.name ?? t("common:emDash")}</td>
                  <td className="py-4 pe-4">{p.ingredient?.name ?? t("common:emDash")}</td>
                  <td className="py-4 pe-4 whitespace-nowrap">
                    {formatNumber(p.quantity)} {p.ingredient?.unit}
                  </td>
                  <td className="py-4 pe-4 font-medium whitespace-nowrap">
                    {formatCurrency(parseFloat(String(p.total_price)))}
                  </td>
                  <td className="py-4 pe-4">
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
                      onClick={() => handleReceive(p.id)}
                      disabled={loading === p.id}
                    >
                      {loading === p.id
                        ? t("common:actions.receiving")
                        : t("common:actions.received")}
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
