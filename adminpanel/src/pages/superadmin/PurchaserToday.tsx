import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchasesTable from "../../components/purchases/PurchasesTable";
import TransferHistoryTable from "../../components/transfers/TransferHistoryTable";
import { SectionCard, StatCard } from "../../components/ui";
import { getIntlLocale } from "../../i18n";
import { api, type Purchase, type Transfer } from "../../services/api";
import { translateApiError } from "../../utils/translateApiError";

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
