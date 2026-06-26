import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import {
  DataTable,
  SectionCard,
  StatCard,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import { api, type Purchase, type PurchaserInventory } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { purchaseSizeLabel } from "../../utils/purchaseStatus";
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

  const columns: DataTableColumn<Purchase>[] = useMemo(
    () => [
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
        key: "size",
        header: t("common:fields.size"),
        render: (p) =>
          p.size ? purchaseSizeLabel(p.size) : t("common:emDash"),
      },
      {
        key: "qty",
        header: t("common:fields.qty"),
        cellClassName: "whitespace-nowrap",
        render: (p) => `${formatNumber(p.quantity)} ${p.ingredient?.unit ?? ""}`,
      },
      {
        key: "total",
        header: t("common:fields.total"),
        cellClassName: "whitespace-nowrap",
        render: (p) => formatCurrency(parseFloat(String(p.total_price))),
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
      {
        key: "action",
        header: t("common:fields.action"),
        render: (p) => (
          <Button
            size="sm"
            disabled={loading === p.id}
            onClick={() => handleHandToChief(p.id)}
          >
            {loading === p.id
              ? t("common:actions.handing")
              : t("common:actions.handToChief")}
          </Button>
        ),
      },
    ],
    [loading, t]
  );

  return (
    <div>
      <PageMeta
        title={t("inventory.metaTitle")}
        description={t("inventory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:myInventory")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}

      {summary.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map((item) => (
            <StatCard
              key={`${item.ingredient_id}-${item.size ?? "none"}`}
              title={
                item.size
                  ? `${item.ingredient?.name ?? ""} (${purchaseSizeLabel(item.size)})`
                  : (item.ingredient?.name ?? "")
              }
              value={`${formatNumber(item.total_quantity)} ${item.ingredient?.unit ?? ""}`}
              accent="brand"
            />
          ))}
        </div>
      )}

      <SectionCard title={t("inventory.itemsToHand")}>
        <DataTable
          columns={columns}
          data={purchases}
          keyExtractor={(p) => p.id}
          emptyMessage={t("inventory.empty")}
          hoverRows
        />
      </SectionCard>
    </div>
  );
}
