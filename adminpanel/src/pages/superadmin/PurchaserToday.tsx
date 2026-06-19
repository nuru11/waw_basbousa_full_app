import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import TransferHistoryTable from "../../components/transfers/TransferHistoryTable";
import { api, type Purchase, type Transfer } from "../../services/api";
import { formatShortDate } from "../../utils/formatDate";
import { purchaseStatusLabel } from "../../utils/purchaseStatus";
import { formatNumber } from "../../utils/formatNumber";

function getPurchaseDate(p: Purchase) {
  return p.created_at ?? p.createdAt;
}

function statusClass(status: Purchase["status"]) {
  switch (status) {
    case "received":
      return "text-success-500";
    case "handed":
    case "in_inventory":
      return "text-brand-500";
    default:
      return "text-warning-500";
  }
}

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-gray-500">{count} today</span>
      </div>
      {children}
    </div>
  );
}

function PurchasesTable({
  purchases,
  emptyMessage,
  dateField,
}: {
  purchases: Purchase[];
  emptyMessage: string;
  dateField: "created_at" | "handed_at";
}) {
  if (purchases.length === 0) {
    return <p className="text-gray-500">{emptyMessage}</p>;
  }

  const getDate = (p: Purchase) => {
    if (dateField === "handed_at") return p.handed_at ?? undefined;
    return getPurchaseDate(p);
  };

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b dark:border-gray-700">
          <th className="pb-3 pr-4">Time</th>
          <th className="pb-3 pr-4">ID</th>
          <th className="pb-3 pr-4">Purchaser</th>
          <th className="pb-3 pr-4">Ingredient</th>
          <th className="pb-3 pr-4">Qty</th>
          <th className="pb-3 pr-4">Total</th>
          <th className="pb-3 pr-4">Status</th>
          <th className="pb-3">Screenshot</th>
        </tr>
      </thead>
      <tbody>
        {purchases.map((p) => (
          <tr
            key={p.id}
            className="border-b border-gray-100 dark:border-gray-800 align-middle"
          >
            <td className="py-4 pr-4 whitespace-nowrap">{formatShortDate(getDate(p))}</td>
            <td className="py-4 pr-4 font-medium">#{p.id}</td>
            <td className="py-4 pr-4">{p.purchaser?.name ?? "—"}</td>
            <td className="py-4 pr-4">{p.ingredient?.name}</td>
            <td className="py-4 pr-4 whitespace-nowrap">
              {formatNumber(p.quantity)} {p.ingredient?.unit}
            </td>
            <td className="py-4 pr-4 font-medium whitespace-nowrap">ETB {p.total_price}</td>
            <td className={`py-4 pr-4 ${statusClass(p.status)}`}>
              {purchaseStatusLabel(p.status)}
            </td>
            <td className="py-4">
              <PurchaseScreenshot
                purchaseId={p.id}
                hasScreenshot={!!p.screenshot_path}
                width={56}
                height={56}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PurchaserTodayPage() {
  const [submitted, setSubmitted] = useState<Purchase[]>([]);
  const [transfersSent, setTransfersSent] = useState<Transfer[]>([]);
  const [transfersAccepted, setTransfersAccepted] = useState<Transfer[]>([]);
  const [handed, setHanded] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      api.get<Purchase[]>("/purchases?period=today&date_field=created_at"),
      api.get<Transfer[]>("/transfers?period=today&date_field=created_at"),
      api.get<Transfer[]>(
        "/transfers?period=today&date_field=accepted_at&status=accepted"
      ),
      api.get<Purchase[]>("/purchases?period=today&date_field=handed_at"),
    ])
      .then(([submittedData, sentData, acceptedData, handedData]) => {
        setSubmitted(submittedData);
        setTransfersSent(sentData);
        setTransfersAccepted(acceptedData);
        setHanded(handedData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalCount =
    submitted.length + transfersSent.length + transfersAccepted.length + handed.length;

  return (
    <div>
      <PageMeta
        title="Purchaser Today | Restaurant"
        description="Today's purchaser activity"
      />
      <PageBreadcrumb pageTitle="Purchaser — Today's Activity" />
      <p className="mb-4 text-sm text-gray-500">{todayLabel}</p>
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Loading today's activity...</p>
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500">Total events today</p>
            <p className="mt-1 text-3xl font-bold text-brand-500">{totalCount}</p>
          </div>

          <SectionCard title="Purchases Submitted" count={submitted.length}>
            <PurchasesTable
              purchases={submitted}
              dateField="created_at"
              emptyMessage="No purchases submitted today"
            />
          </SectionCard>

          <SectionCard title="Transfers Sent" count={transfersSent.length}>
            <TransferHistoryTable
              transfers={transfersSent}
              showPurchaser
              showCreator
              emptyMessage="No transfers sent today"
            />
          </SectionCard>

          <SectionCard title="Transfers Accepted" count={transfersAccepted.length}>
            <TransferHistoryTable
              transfers={transfersAccepted}
              showPurchaser
              showCreator={false}
              emptyMessage="No transfers accepted today"
            />
          </SectionCard>

          <SectionCard title="Handed to Chief" count={handed.length}>
            <PurchasesTable
              purchases={handed}
              dateField="handed_at"
              emptyMessage="No items handed to chief today"
            />
          </SectionCard>
        </div>
      )}
    </div>
  );
}
