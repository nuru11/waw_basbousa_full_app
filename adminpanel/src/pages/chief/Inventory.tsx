import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { api, type Ingredient } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";

export default function InventoryPage() {
  const { t } = useTranslation(["chief", "nav"]);
  const [stock, setStock] = useState<Ingredient[]>([]);

  useEffect(() => {
    api.get<Ingredient[]>("/stock").then(setStock);
  }, []);

  return (
    <div>
      <PageMeta
        title={t("inventory.metaTitle")}
        description={t("inventory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:inventoryRemainingFood")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stock.map((item) => {
          const low =
            parseFloat(String(item.current_stock)) <=
            parseFloat(String(item.min_stock || 0));
          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border ${
                low
                  ? "border-error-300 bg-error-50 dark:bg-error-500/10"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <h3 className="font-semibold text-gray-800 dark:text-white/90">
                {item.name}
              </h3>
              <p className="mt-2 text-3xl font-bold text-brand-500">
                {formatNumber(item.current_stock)}{" "}
                <span className="text-base font-normal text-gray-500">{item.unit}</span>
              </p>
              {low && (
                <p className="mt-1 text-sm text-error-500">{t("inventory.lowStockAlert")}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
