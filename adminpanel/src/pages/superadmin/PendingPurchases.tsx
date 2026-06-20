import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import {
  DataTable,
  SectionCard,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
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
      {
        key: "action",
        header: tCommon("fields.action"),
        render: (p) => (
          <Button
            size="sm"
            onClick={() => handleApprove(p.id)}
            disabled={loading === p.id}
          >
            {loading === p.id
              ? tCommon("actions.approving")
              : tCommon("actions.approve")}
          </Button>
        ),
      },
    ],
    [loading, tCommon]
  );

  return (
    <div>
      <PageMeta
        title={t("pendingPurchases.metaTitle")}
        description={t("pendingPurchases.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("pendingPurchases")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <SectionCard title={tNav("pendingPurchases")}>
        <DataTable
          columns={columns}
          data={purchases}
          keyExtractor={(p) => p.id}
          emptyMessage={t("pendingPurchases.empty")}
          hoverRows
        />
      </SectionCard>
    </div>
  );
}
