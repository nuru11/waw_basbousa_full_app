import { useTranslation } from "react-i18next";
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

  if (transfers.length === 0) {
    return (
      <p className="text-gray-500">
        {emptyMessage ?? t("transfers.noTransfersFound")}
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-start text-gray-500 border-b dark:border-gray-700">
          <th className="pb-3">{t("fields.when")}</th>
          <th className="pb-3">{t("fields.date")}</th>
          {showPurchaser && <th className="pb-3">{t("fields.purchaser")}</th>}
          {showCreator && <th className="pb-3">{t("fields.from")}</th>}
          <th className="pb-3">{t("fields.amount")}</th>
          <th className="pb-3">{t("fields.status")}</th>
          <th className="pb-3">{t("fields.spent")}</th>
          <th className="pb-3">{t("fields.remaining")}</th>
        </tr>
      </thead>
      <tbody>
        {transfers.map((tfr) => {
          const amount = parseFloat(String(tfr.amount));
          const isPending = tfr.status === "pending";
          const remaining = isPending ? 0 : parseFloat(String(tfr.amount_remaining));
          const spent = isPending ? 0 : amount - remaining;
          const dateStr = getTransferDateStr(tfr);
          return (
            <tr key={tfr.id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-3">{formatRelativeDate(dateStr)}</td>
              <td className="py-3">{formatShortDate(dateStr)}</td>
              {showPurchaser && <td className="py-3">{tfr.purchaser?.name}</td>}
              {showCreator && (
                <td className="py-3">{tfr.creator?.name ?? t("superAdmin")}</td>
              )}
              <td className="py-3">{formatCurrency(amount)}</td>
              <td className="py-3">
                <span
                  className={
                    isPending ? "text-warning-500" : "text-success-500"
                  }
                >
                  {isPending ? t("status.pending") : t("status.accepted")}
                </span>
              </td>
              <td className="py-3">
                {isPending ? t("emDash") : formatCurrency(spent)}
              </td>
              <td className={`py-3 ${!isPending && remaining < 0 ? "text-error-500" : ""}`}>
                {isPending ? t("emDash") : formatCurrency(remaining)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
