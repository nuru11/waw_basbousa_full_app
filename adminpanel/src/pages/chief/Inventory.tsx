import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { StatCard } from "../../components/ui";
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
            <StatCard
              key={item.id}
              title={item.name}
              value={`${formatNumber(item.current_stock)} ${item.unit}`}
              subtitle={low ? t("inventory.lowStockAlert") : undefined}
              accent={low ? "error" : "brand"}
            />
          );
        })}
      </div>
    </div>
  );
}
