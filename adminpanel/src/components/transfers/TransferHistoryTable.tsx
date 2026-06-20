import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  DataTable,
  EmptyState,
  StatusBadge,
} from "../ui";
import type { DataTableColumn } from "../ui";
import type { Transfer } from "../../services/api";
import { formatRelativeDate, formatShortDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";

function getTransferDateStr(transfer: Transfer) {
  return transfer.createdAt ?? transfer.created_at;
}

type Props = {
  transfers: Transfer[];
  emptyMessage?: string;
  showPurchaser?: boolean;
  showCreator?: boolean;
};

export default function TransferHistoryTable({
  transfers,
  emptyMessage,
  showPurchaser = true,
  showCreator = false,
}: Props) {
  const { t } = useTranslation("common");

  const columns: DataTableColumn<Transfer>[] = useMemo(() => {
    const cols: DataTableColumn<Transfer>[] = [
      {
        key: "when",
        header: t("fields.when"),
        render: (tfr) => formatRelativeDate(getTransferDateStr(tfr)),
      },
      {
        key: "date",
        header: t("fields.date"),
        render: (tfr) => formatShortDate(getTransferDateStr(tfr)),
      },
    ];

    if (showPurchaser) {
      cols.push({
        key: "purchaser",
        header: t("fields.purchaser"),
        render: (tfr) => tfr.purchaser?.name ?? t("emDash"),
      });
    }

    if (showCreator) {
      cols.push({
        key: "creator",
        header: t("fields.from"),
        render: (tfr) => tfr.creator?.name ?? t("superAdmin"),
      });
    }

    cols.push(
      {
        key: "amount",
        header: t("fields.amount"),
        render: (tfr) => formatCurrency(parseFloat(String(tfr.amount))),
      },
      {
        key: "status",
        header: t("fields.status"),
        render: (tfr) => (
          <StatusBadge variant={tfr.status === "pending" ? "pending" : "approved"}>
            {tfr.status === "pending" ? t("status.pending") : t("status.accepted")}
          </StatusBadge>
        ),
      },
      {
        key: "spent",
        header: t("fields.spent"),
        render: (tfr) => {
          const isPending = tfr.status === "pending";
          if (isPending) return t("emDash");
          const amount = parseFloat(String(tfr.amount));
          const remaining = parseFloat(String(tfr.amount_remaining));
          return formatCurrency(amount - remaining);
        },
      },
      {
        key: "remaining",
        header: t("fields.remaining"),
        render: (tfr) => {
          const isPending = tfr.status === "pending";
          if (isPending) return t("emDash");
          const remaining = parseFloat(String(tfr.amount_remaining));
          return (
            <span className={remaining < 0 ? "text-error-500" : undefined}>
              {formatCurrency(remaining)}
            </span>
          );
        },
      }
    );

    return cols;
  }, [showCreator, showPurchaser, t]);

  if (transfers.length === 0) {
    return <EmptyState message={emptyMessage ?? t("transfers.noTransfersFound")} />;
  }

  return (
    <DataTable
      columns={columns}
      data={transfers}
      keyExtractor={(tfr) => tfr.id}
      hoverRows
    />
  );
}
