import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { api, type Purchase } from "../../services/api";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { translateApiError } from "../../utils/translateApiError";

export default function PendingPurchasesPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get<Purchase[]>("/purchases?status=pending")
      .then(setPurchases)
      .catch((e) => setError(translateApiError(e)));

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
      setError(translateApiError(err, "admin:pendingPurchases.failedToApprove"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <PageMeta
        title={t("pendingPurchases.metaTitle")}
        description={t("pendingPurchases.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("pendingPurchases")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <h3 className="mb-4 font-semibold">{tNav("pendingPurchases")}</h3>
        {purchases.length === 0 ? (
          <p className="text-gray-500">{t("pendingPurchases.empty")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pe-4">{tCommon("fields.id")}</th>
                <th className="pb-3 pe-4">{tCommon("fields.purchaser")}</th>
                <th className="pb-3 pe-4">{tCommon("fields.ingredient")}</th>
                <th className="pb-3 pe-4">{tCommon("fields.qty")}</th>
                <th className="pb-3 pe-4">{tCommon("fields.unitPrice")}</th>
                <th className="pb-3 pe-4">{tCommon("fields.total")}</th>
                <th className="pb-3 pe-4">{tCommon("fields.screenshot")}</th>
                <th className="pb-3">{tCommon("fields.action")}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-100 dark:border-gray-800 align-middle"
                >
                  <td className="py-4 pe-4 font-medium text-gray-800 dark:text-white/90">
                    {tCommon("idShort", { id: p.id })}
                  </td>
                  <td className="py-4 pe-4">{p.purchaser?.name}</td>
                  <td className="py-4 pe-4">{p.ingredient?.name}</td>
                  <td className="py-4 pe-4 whitespace-nowrap">
                    {formatNumber(p.quantity)} {p.ingredient?.unit}
                  </td>
                  <td className="py-4 pe-4 whitespace-nowrap">
                    {formatCurrency(parseFloat(String(p.unit_price)))}
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
                      onClick={() => handleApprove(p.id)}
                      disabled={loading === p.id}
                    >
                      {loading === p.id ? tCommon("actions.approving") : tCommon("actions.approve")}
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
