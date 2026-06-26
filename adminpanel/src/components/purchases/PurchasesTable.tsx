import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import PurchaseScreenshot from "./PurchaseScreenshot";
import {
  DataTable,
  purchaseStatusVariant,
  StatusBadge,
} from "../ui";
import type { DataTableColumn } from "../ui";
import type { Purchase } from "../../services/api";
import { formatShortDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { purchaseStatusLabel, purchaseSizeLabel } from "../../utils/purchaseStatus";

function getPurchaseDate(p: Purchase) {
  return p.created_at ?? p.createdAt;
}

export default function PurchasesTable({
  purchases,
  emptyMessage,
  dateField = "created_at",
  showUnitPrice = false,
}: {
  purchases: Purchase[];
  emptyMessage: string;
  dateField?: "created_at" | "handed_at";
  showUnitPrice?: boolean;
}) {
  const { t: tCommon } = useTranslation("common");

  const getDate = (p: Purchase) => {
    if (dateField === "handed_at") return p.handed_at ?? undefined;
    return getPurchaseDate(p);
  };

  const columns: DataTableColumn<Purchase>[] = useMemo(
    () => {
      const cols: DataTableColumn<Purchase>[] = [
        {
          key: "time",
          header: tCommon("fields.date"),
          cellClassName: "whitespace-nowrap",
          render: (p) => formatShortDate(getDate(p)),
        },
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
          key: "size",
          header: tCommon("fields.size"),
          render: (p) =>
            p.size ? purchaseSizeLabel(p.size) : tCommon("emDash"),
        },
        {
          key: "qty",
          header: tCommon("fields.qty"),
          cellClassName: "whitespace-nowrap",
          render: (p) => `${formatNumber(p.quantity)} ${p.ingredient?.unit ?? ""}`,
        },
      ];

      if (showUnitPrice) {
        cols.push({
          key: "unitPrice",
          header: tCommon("fields.unitPrice"),
          cellClassName: "whitespace-nowrap",
          render: (p) => formatCurrency(parseFloat(String(p.unit_price))),
        });
      }

      cols.push(
        {
          key: "total",
          header: tCommon("fields.total"),
          cellClassName: "whitespace-nowrap font-medium",
          render: (p) => formatCurrency(parseFloat(String(p.total_price))),
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
              width={56}
              height={56}
            />
          ),
        }
      );

      return cols;
    },
    [dateField, showUnitPrice, tCommon]
  );

  return (
    <DataTable
      columns={columns}
      data={purchases}
      keyExtractor={(p) => p.id}
      emptyMessage={emptyMessage}
      hoverRows
    />
  );
}
