import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import {
  DataTable,
  purchaseStatusVariant,
  SectionCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { api, type Purchase } from "../../services/api";
import { formatShortDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { purchaseStatusLabel } from "../../utils/purchaseStatus";
import { translateApiError } from "../../utils/translateApiError";

function getPurchaseDate(p: Purchase) {
  return p.created_at ?? p.createdAt;
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

  const columns: DataTableColumn<Purchase>[] = useMemo(
    () => [
      {
        key: "date",
        header: t("common:fields.date"),
        cellClassName: "whitespace-nowrap",
        render: (p) => formatShortDate(getPurchaseDate(p)),
      },
      {
        key: "id",
        header: t("common:fields.id"),
        render: (p) => (
          <span className="font-medium">
            {t("common:idShort", { id: p.id })}
          </span>
        ),
      },
      {
        key: "ingredient",
        header: t("common:fields.ingredient"),
        render: (p) => p.ingredient?.name ?? t("common:emDash"),
      },
      {
        key: "qty",
        header: t("common:fields.qty"),
        cellClassName: "whitespace-nowrap",
        render: (p) => `${formatNumber(p.quantity)} ${p.ingredient?.unit ?? ""}`,
      },
      {
        key: "unitPrice",
        header: t("common:fields.unitPrice"),
        cellClassName: "whitespace-nowrap",
        render: (p) => formatCurrency(parseFloat(String(p.unit_price))),
      },
      {
        key: "total",
        header: t("common:fields.total"),
        cellClassName: "font-medium whitespace-nowrap",
        render: (p) => formatCurrency(parseFloat(String(p.total_price))),
      },
      {
        key: "status",
        header: t("common:fields.status"),
        render: (p) => (
          <StatusBadge variant={purchaseStatusVariant(p.status)}>
            {purchaseStatusLabel(p.status)}
          </StatusBadge>
        ),
      },
      {
        key: "screenshot",
        header: t("common:fields.screenshot"),
        render: (p) => (
          <PurchaseScreenshot
            purchaseId={p.id}
            hasScreenshot={!!p.screenshot_path}
            width={56}
            height={56}
          />
        ),
      },
    ],
    [t]
  );

  return (
    <div>
      <PageMeta
        title={t("purchaseHistory.metaTitle")}
        description={t("purchaseHistory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:purchaseHistory")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <SectionCard title={t("purchaseHistory.allPurchases")}>
        <DataTable
          columns={columns}
          data={purchases}
          keyExtractor={(p) => p.id}
          emptyMessage={t("purchaseHistory.empty")}
          hoverRows
        />
      </SectionCard>
    </div>
  );
}
