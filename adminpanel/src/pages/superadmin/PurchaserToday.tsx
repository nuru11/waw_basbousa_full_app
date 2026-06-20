import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import TransferHistoryTable from "../../components/transfers/TransferHistoryTable";
import { getIntlLocale } from "../../i18n";
import { api, type Purchase, type Transfer } from "../../services/api";
import { formatShortDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import { purchaseStatusLabel } from "../../utils/purchaseStatus";
import { formatNumber } from "../../utils/formatNumber";
import { translateApiError } from "../../utils/translateApiError";

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
  const { t: tCommon } = useTranslation("common");

  return (
    <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-gray-500">{tCommon("todayCount", { count })}</span>
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
  const { t: tCommon } = useTranslation("common");

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
        <tr className="text-start text-gray-500 border-b dark:border-gray-700">
          <th className="pb-3 pe-4">{tCommon("fields.time")}</th>
          <th className="pb-3 pe-4">{tCommon("fields.id")}</th>
          <th className="pb-3 pe-4">{tCommon("fields.purchaser")}</th>
          <th className="pb-3 pe-4">{tCommon("fields.ingredient")}</th>
          <th className="pb-3 pe-4">{tCommon("fields.qty")}</th>
          <th className="pb-3 pe-4">{tCommon("fields.total")}</th>
          <th className="pb-3 pe-4">{tCommon("fields.status")}</th>
          <th className="pb-3">{tCommon("fields.screenshot")}</th>
        </tr>
      </thead>
      <tbody>
        {purchases.map((p) => (
          <tr
            key={p.id}
            className="border-b border-gray-100 dark:border-gray-800 align-middle"
          >
            <td className="py-4 pe-4 whitespace-nowrap">{formatShortDate(getDate(p))}</td>
            <td className="py-4 pe-4 font-medium">{tCommon("idShort", { id: p.id })}</td>
            <td className="py-4 pe-4">{p.purchaser?.name ?? tCommon("emDash")}</td>
            <td className="py-4 pe-4">{p.ingredient?.name}</td>
            <td className="py-4 pe-4 whitespace-nowrap">
              {formatNumber(p.quantity)} {p.ingredient?.unit}
            </td>
            <td className="py-4 pe-4 font-medium whitespace-nowrap">
              {formatCurrency(parseFloat(String(p.total_price)))}
            </td>
            <td className={`py-4 pe-4 ${statusClass(p.status)}`}>
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
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [submitted, setSubmitted] = useState<Purchase[]>([]);
  const [transfersSent, setTransfersSent] = useState<Transfer[]>([]);
  const [transfersAccepted, setTransfersAccepted] = useState<Transfer[]>([]);
  const [handed, setHanded] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const todayLabel = new Date().toLocaleDateString(getIntlLocale(), {
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
      .catch((e) => setError(translateApiError(e)))
      .finally(() => setLoading(false));
  }, []);

  const totalCount =
    submitted.length + transfersSent.length + transfersAccepted.length + handed.length;

  return (
    <div>
      <PageMeta
        title={t("purchaserToday.metaTitle")}
        description={t("purchaserToday.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("purchaserTodayTitle")} />
      <p className="mb-4 text-sm text-gray-500">{todayLabel}</p>
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500">{tCommon("loadingTodayActivity")}</p>
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500">{tCommon("totalEventsToday")}</p>
            <p className="mt-1 text-3xl font-bold text-brand-500">{totalCount}</p>
          </div>

          <SectionCard title={t("purchaserToday.purchasesSubmitted")} count={submitted.length}>
            <PurchasesTable
              purchases={submitted}
              dateField="created_at"
              emptyMessage={t("purchaserToday.noPurchasesSubmitted")}
            />
          </SectionCard>

          <SectionCard title={t("purchaserToday.transfersSent")} count={transfersSent.length}>
            <TransferHistoryTable
              transfers={transfersSent}
              showPurchaser
              showCreator
              emptyMessage={t("purchaserToday.noTransfersSent")}
            />
          </SectionCard>

          <SectionCard title={t("purchaserToday.transfersAccepted")} count={transfersAccepted.length}>
            <TransferHistoryTable
              transfers={transfersAccepted}
              showPurchaser
              showCreator={false}
              emptyMessage={t("purchaserToday.noTransfersAccepted")}
            />
          </SectionCard>

          <SectionCard title={t("purchaserToday.handedToChief")} count={handed.length}>
            <PurchasesTable
              purchases={handed}
              dateField="handed_at"
              emptyMessage={t("purchaserToday.noHandedToChief")}
            />
          </SectionCard>
        </div>
      )}
    </div>
  );
}
