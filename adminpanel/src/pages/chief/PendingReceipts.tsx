import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { DataTable, SectionCard } from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { api, type Purchase } from "../../services/api";
import { formatRelativeDate, formatShortDate } from "../../utils/formatDate";
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

  const columns: DataTableColumn<Purchase>[] = useMemo(
    () => [
      {
        key: "id",
        header: t("common:fields.id"),
        render: (p) => (
          <span className="font-medium text-gray-800 dark:text-white/90">
            {t("common:idShort", { id: p.id })}
          </span>
        ),
      },
      {
        key: "when",
        header: t("common:fields.when"),
        render: (p) => formatRelativeDate(p.handed_at ?? undefined),
      },
      {
        key: "date",
        header: t("common:fields.date"),
        render: (p) => formatShortDate(p.handed_at ?? undefined),
      },
      {
        key: "from",
        header: t("common:fields.from"),
        render: (p) => p.purchaser?.name ?? t("common:emDash"),
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
        key: "action",
        header: t("common:fields.action"),
        render: (p) => (
          <Button
            size="sm"
            onClick={() => handleReceive(p.id)}
            disabled={loading === p.id}
          >
            {loading === p.id
              ? t("common:actions.receiving")
              : t("common:actions.received")}
          </Button>
        ),
      },
    ],
    [loading, t]
  );

  return (
    <div>
      <PageMeta
        title={t("pendingReceipts.metaTitle")}
        description={t("pendingReceipts.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:pendingReceipts")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <SectionCard title={t("pendingReceipts.awaitingReceipt")}>
        <DataTable
          columns={columns}
          data={purchases}
          keyExtractor={(p) => p.id}
          emptyMessage={t("pendingReceipts.empty")}
          hoverRows
        />
      </SectionCard>
    </div>
  );
}
