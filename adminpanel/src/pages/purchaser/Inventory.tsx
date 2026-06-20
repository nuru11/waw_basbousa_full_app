import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import { api, type PurchaserInventory } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { translateApiError } from "../../utils/translateApiError";

export default function PurchaserInventoryPage() {
  const { t } = useTranslation(["purchaser", "common", "nav"]);
  const [inventory, setInventory] = useState<PurchaserInventory | null>(null);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get<PurchaserInventory>("/purchases/inventory")
      .then(setInventory)
      .catch((e) => setError(translateApiError(e)));

  useEffect(() => {
    load();
  }, []);

  async function handleHandToChief(id: number) {
    setLoading(id);
    setError("");
    try {
      await api.post(`/purchases/${id}/hand-to-chief`, {});
      load();
    } catch (err: unknown) {
      setError(translateApiError(err, "purchaser:inventory.failedToHand"));
    } finally {
      setLoading(null);
    }
  }

  const summary = inventory?.summary ?? [];
  const purchases = inventory?.purchases ?? [];

  return (
    <div>
      <PageMeta
        title={t("inventory.metaTitle")}
        description={t("inventory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:myInventory")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}

      {summary.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map((item) => (
            <div
              key={item.ingredient_id}
              className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800"
            >
              <h3 className="font-semibold text-gray-800 dark:text-white/90">
                {item.ingredient?.name}
              </h3>
              <p className="mt-2 text-3xl font-bold text-brand-500">
                {formatNumber(item.total_quantity)}{" "}
                <span className="text-base font-normal text-gray-500">
                  {item.ingredient?.unit}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <h3 className="mb-4 font-semibold">{t("inventory.itemsToHand")}</h3>
        {purchases.length === 0 ? (
          <p className="text-gray-500">{t("inventory.empty")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pe-4">{t("common:fields.id")}</th>
                <th className="pb-3 pe-4">{t("common:fields.ingredient")}</th>
                <th className="pb-3 pe-4">{t("common:fields.qty")}</th>
                <th className="pb-3 pe-4">{t("common:fields.total")}</th>
                <th className="pb-3 pe-4">{t("common:fields.screenshot")}</th>
                <th className="pb-3">{t("common:fields.action")}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-100 dark:border-gray-800 align-middle"
                >
                  <td className="py-4 pe-4 font-medium">
                    {t("common:idShort", { id: p.id })}
                  </td>
                  <td className="py-4 pe-4">{p.ingredient?.name}</td>
                  <td className="py-4 pe-4 whitespace-nowrap">
                    {formatNumber(p.quantity)} {p.ingredient?.unit}
                  </td>
                  <td className="py-4 pe-4 whitespace-nowrap">
                    {formatCurrency(parseFloat(String(p.total_price)))}
                  </td>
                  <td className="py-4 pe-4">
                    <PurchaseScreenshot
                      purchaseId={p.id}
                      hasScreenshot={!!p.screenshot_path}
                      width={56}
                      height={56}
                    />
                  </td>
                  <td className="py-4">
                    <Button
                      size="sm"
                      disabled={loading === p.id}
                      onClick={() => handleHandToChief(p.id)}
                    >
                      {loading === p.id
                        ? t("common:actions.handing")
                        : t("common:actions.handToChief")}
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
