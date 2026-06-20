import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import TransferHistoryTable from "../../components/transfers/TransferHistoryTable";
import {
  DataTable,
  purchaseStatusVariant,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
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

  const getDate = (p: Purchase) => {
    if (dateField === "handed_at") return p.handed_at ?? undefined;
    return getPurchaseDate(p);
  };

  const columns: DataTableColumn<Purchase>[] = useMemo(
    () => [
      {
        key: "time",
        header: tCommon("fields.time"),
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
        key: "qty",
        header: tCommon("fields.qty"),
        cellClassName: "whitespace-nowrap",
        render: (p) => `${formatNumber(p.quantity)} ${p.ingredient?.unit ?? ""}`,
      },
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
      },
    ],
    [dateField, tCommon]
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
      <PageBreadcrumb pageTitle={tNav("purchaserTodayTitle")} subtitle={todayLabel} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{tCommon("loadingTodayActivity")}</p>
      ) : (
        <div className="space-y-6">
          <StatCard
            title={tCommon("totalPlatesToday")}
            value={String(totalCount)}
            accent="brand"
          />

          <SectionCard
            title={t("purchaserToday.purchasesSubmitted")}
            count={tCommon("todayCount", { count: submitted.length })}
          >
            <PurchasesTable
              purchases={submitted}
              dateField="created_at"
              emptyMessage={t("purchaserToday.noPurchasesSubmitted")}
            />
          </SectionCard>

          <SectionCard
            title={t("purchaserToday.transfersSent")}
            count={tCommon("todayCount", { count: transfersSent.length })}
          >
            <TransferHistoryTable
              transfers={transfersSent}
              showPurchaser
              showCreator
              emptyMessage={t("purchaserToday.noTransfersSent")}
            />
          </SectionCard>

          <SectionCard
            title={t("purchaserToday.transfersAccepted")}
            count={tCommon("todayCount", { count: transfersAccepted.length })}
          >
            <TransferHistoryTable
              transfers={transfersAccepted}
              showPurchaser
              showCreator={false}
              emptyMessage={t("purchaserToday.noTransfersAccepted")}
            />
          </SectionCard>

          <SectionCard
            title={t("purchaserToday.handedToChief")}
            count={tCommon("todayCount", { count: handed.length })}
          >
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
