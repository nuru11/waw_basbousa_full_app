import type { Transfer } from "../../services/api";
import { formatRelativeDate, formatShortDate } from "../../utils/formatDate";

function formatEtb(value: number | string) {
  return parseFloat(String(value)).toFixed(2);
}

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
  emptyMessage = "No transfers found",
  showPurchaser = true,
  showCreator = false,
}: Props) {
  if (transfers.length === 0) {
    return <p className="text-gray-500">{emptyMessage}</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b dark:border-gray-700">
          <th className="pb-3">When</th>
          <th className="pb-3">Date</th>
          {showPurchaser && <th className="pb-3">Purchaser</th>}
          {showCreator && <th className="pb-3">From</th>}
          <th className="pb-3">Amount</th>
          <th className="pb-3">Status</th>
          <th className="pb-3">Spent</th>
          <th className="pb-3">Remaining</th>
        </tr>
      </thead>
      <tbody>
        {transfers.map((t) => {
          const amount = parseFloat(String(t.amount));
          const isPending = t.status === "pending";
          const remaining = isPending ? 0 : parseFloat(String(t.amount_remaining));
          const spent = isPending ? 0 : amount - remaining;
          const dateStr = getTransferDateStr(t);
          return (
            <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-3">{formatRelativeDate(dateStr)}</td>
              <td className="py-3">{formatShortDate(dateStr)}</td>
              {showPurchaser && <td className="py-3">{t.purchaser?.name}</td>}
              {showCreator && (
                <td className="py-3">{t.creator?.name ?? "SuperAdmin"}</td>
              )}
              <td className="py-3">ETB {formatEtb(amount)}</td>
              <td className="py-3">
                <span
                  className={
                    isPending ? "text-warning-500" : "text-success-500"
                  }
                >
                  {isPending ? "Pending" : "Accepted"}
                </span>
              </td>
              <td className="py-3">
                {isPending ? "—" : `ETB ${formatEtb(spent)}`}
              </td>
              <td className={`py-3 ${!isPending && remaining < 0 ? "text-error-500" : ""}`}>
                {isPending ? "—" : `ETB ${formatEtb(remaining)}`}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
