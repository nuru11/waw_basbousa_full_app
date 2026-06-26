import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  DataTable,
  purchaseStatusVariant,
  SectionCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { api, type Purchase } from "../../services/api";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { purchaseStatusLabel } from "../../utils/purchaseStatus";
import { translateApiError } from "../../utils/translateApiError";

export default function PendingPurchasesPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get<Purchase[]>("/purchases?status=in_inventory,handed")
      .then(setPurchases)
      .catch((e) => setError(translateApiError(e)));

  useEffect(() => {
    load();
  }, []);

  const columns: DataTableColumn<Purchase>[] = useMemo(
    () => [
      {
        key: "id",
        header: tCommon("fields.id"),
        render: (p) => (
          <span className="font-medium text-gray-800 dark:text-white/90">
            {tCommon("idShort", { id: p.id })}
          </span>
        ),
      },
      {
        key: "purchaser",
        header: tCommon("fields.purchaser"),
        render: (p) => p.purchaser?.name ?? tCommon("emDash"),
      },
      {
        key: "ingredient",
        header: tCommon("fields.ingredient"),
        render: (p) => p.ingredient?.name ?? tCommon("emDash"),
      },
      {
        key: "qty",
        header: tCommon("fields.qty"),
        cellClassName: "whitespace-nowrap",
        render: (p) => `${formatNumber(p.quantity)} ${p.ingredient?.unit ?? ""}`,
      },
      {
        key: "unitPrice",
        header: tCommon("fields.unitPrice"),
        cellClassName: "whitespace-nowrap",
        render: (p) => formatCurrency(parseFloat(String(p.unit_price))),
      },
      {
        key: "total",
        header: tCommon("fields.total"),
        cellClassName: "whitespace-nowrap font-medium",
        render: (p) => formatCurrency(parseFloat(String(p.total_price))),
      },
      {
        key: "location",
        header: tCommon("fields.location"),
        render: (p) =>
          p.status === "in_inventory"
            ? t("inventoryLocations.withPurchaser", {
                name: p.purchaser?.name ?? tCommon("emDash"),
              })
            : t("inventoryLocations.handedToChief"),
      },
      {
        key: "status",
        header: tCommon("fields.status"),
        render: (p) => (
          <StatusBadge variant={purchaseStatusVariant(p.status)}>
            {purchaseStatusLabel(p.status)}
          </StatusBadge>
        ),
      },
      {
        key: "screenshot",
        header: tCommon("fields.screenshot"),
        render: (p) => (
          <PurchaseScreenshot
            purchaseId={p.id}
            hasScreenshot={!!p.screenshot_path}
            width={72}
            height={72}
          />
        ),
      },
    ],
    [t, tCommon]
  );

  return (
    <div>
      <PageMeta
        title={t("inventoryLocations.metaTitle")}
        description={t("inventoryLocations.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("inventoryLocations")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <SectionCard title={tNav("inventoryLocations")}>
        <DataTable
          columns={columns}
          data={purchases}
          keyExtractor={(p) => p.id}
          emptyMessage={t("inventoryLocations.empty")}
          hoverRows
        />
      </SectionCard>
    </div>
  );
}
