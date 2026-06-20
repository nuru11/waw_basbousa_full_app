import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import { api, type Purchase } from "../../services/api";
import { formatShortDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { purchaseStatusLabel } from "../../utils/purchaseStatus";
import { translateApiError } from "../../utils/translateApiError";

function getPurchaseDate(p: Purchase) {
  return p.created_at ?? p.createdAt;
}

function statusClass(status: Purchase["status"]) {
  switch (status) {
    case "received":
      return "text-success-500";
    case "handed":
    case "in_inventory":
      return "text-brand-500";
    default:
      return "text-warning-500";
  }
}

export default function PurchaseHistoryPage() {
  const { t } = useTranslation(["purchaser", "common", "nav"]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Purchase[]>("/purchases")
      .then(setPurchases)
      .catch((e) => setError(translateApiError(e)));
  }, []);

  return (
    <div>
      <PageMeta
        title={t("purchaseHistory.metaTitle")}
        description={t("purchaseHistory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:purchaseHistory")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <h3 className="mb-4 font-semibold">{t("purchaseHistory.allPurchases")}</h3>
        {purchases.length === 0 ? (
          <p className="text-gray-500">{t("purchaseHistory.empty")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3 pe-4">{t("common:fields.date")}</th>
                <th className="pb-3 pe-4">{t("common:fields.id")}</th>
                <th className="pb-3 pe-4">{t("common:fields.ingredient")}</th>
                <th className="pb-3 pe-4">{t("common:fields.qty")}</th>
                <th className="pb-3 pe-4">{t("common:fields.unitPrice")}</th>
                <th className="pb-3 pe-4">{t("common:fields.total")}</th>
                <th className="pb-3 pe-4">{t("common:fields.status")}</th>
                <th className="pb-3">{t("common:fields.screenshot")}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-100 dark:border-gray-800 align-middle"
                >
                  <td className="py-4 pe-4 whitespace-nowrap">
                    {formatShortDate(getPurchaseDate(p))}
                  </td>
                  <td className="py-4 pe-4 font-medium">
                    {t("common:idShort", { id: p.id })}
                  </td>
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
                  <td className={`py-4 pe-4 ${statusClass(p.status)}`}>
                    {purchaseStatusLabel(p.status)}
                  </td>
                  <td className="py-4">
                    <PurchaseScreenshot
                      purchaseId={p.id}
                      hasScreenshot={!!p.screenshot_path}
                      width={56}
                      height={56}
                    />
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
