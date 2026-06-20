import type { Transfer, TransferSummary } from "../services/api";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function computeTransferSummary(
  transfers: Transfer[]
): Pick<
  TransferSummary,
  | "total_sent"
  | "total_pending"
  | "total_transferred"
  | "total_spent"
  | "total_remaining"
> {
  let totalSent = 0;
  let totalPending = 0;
  let totalAccepted = 0;
  let totalRemaining = 0;

  for (const transfer of transfers) {
    const amount = parseFloat(String(transfer.amount));
    totalSent += amount;

    if (transfer.status === "pending") {
      totalPending += amount;
    } else {
      totalAccepted += amount;
      totalRemaining += parseFloat(String(transfer.amount_remaining));
    }
  }

  return {
    total_sent: round2(totalSent),
    total_pending: round2(totalPending),
    total_transferred: round2(totalAccepted),
    total_spent: round2(totalAccepted - totalRemaining),
    total_remaining: round2(totalRemaining),
  };
}
