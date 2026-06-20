import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { DataTable, SectionCard } from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { api, type Transfer } from "../../services/api";
import { formatRelativeDate, formatShortDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import { translateApiError } from "../../utils/translateApiError";

function getTransferDateStr(transfer: Transfer) {
  return transfer.createdAt ?? transfer.created_at;
}

export default function PendingTransfersPage() {
  const { t } = useTranslation(["purchaser", "common", "nav"]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get<Transfer[]>("/transfers?status=pending")
      .then(setTransfers)
      .catch((e) => setError(translateApiError(e)));

  useEffect(() => {
    load();
  }, []);

  async function handleAccept(id: number) {
    setLoading(id);
    setError("");
    try {
      await api.post(`/transfers/${id}/accept`, {});
      load();
    } catch (err: unknown) {
      setError(translateApiError(err, "purchaser:pendingTransfers.failedToAccept"));
    } finally {
      setLoading(null);
    }
  }

  const columns: DataTableColumn<Transfer>[] = useMemo(
    () => [
      {
        key: "when",
        header: t("common:fields.when"),
        render: (tr) => formatRelativeDate(getTransferDateStr(tr)),
      },
      {
        key: "date",
        header: t("common:fields.date"),
        render: (tr) => formatShortDate(getTransferDateStr(tr)),
      },
      {
        key: "from",
        header: t("common:fields.from"),
        render: (tr) => tr.creator?.name ?? t("common:superAdmin"),
      },
      {
        key: "amount",
        header: t("common:fields.amount"),
        cellClassName: "font-medium whitespace-nowrap",
        render: (tr) => formatCurrency(parseFloat(String(tr.amount))),
      },
      {
        key: "action",
        header: t("common:fields.action"),
        render: (tr) => (
          <Button
            size="sm"
            disabled={loading === tr.id}
            onClick={() => handleAccept(tr.id)}
          >
            {loading === tr.id
              ? t("common:actions.accepting")
              : t("common:actions.accept")}
          </Button>
        ),
      },
    ],
    [loading, t]
  );

  return (
    <div>
      <PageMeta
        title={t("pendingTransfers.metaTitle")}
        description={t("pendingTransfers.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:pendingTransfers")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <SectionCard title={t("pendingTransfers.awaitingAcceptance")}>
        <DataTable
          columns={columns}
          data={transfers}
          keyExtractor={(tr) => tr.id}
          emptyMessage={t("pendingTransfers.empty")}
          hoverRows
        />
      </SectionCard>
    </div>
  );
}
