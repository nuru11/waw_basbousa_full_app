import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import TransferHistoryTable from "../../components/transfers/TransferHistoryTable";
import { api, type Transfer } from "../../services/api";
import { translateApiError } from "../../utils/translateApiError";

export default function PurchaserTransferHistoryPage() {
  const { t } = useTranslation(["purchaser", "common", "nav"]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Transfer[]>("/transfers?status=accepted")
      .then(setTransfers)
      .catch((e) => setError(translateApiError(e)));
  }, []);

  return (
    <div>
      <PageMeta
        title={t("transferHistory.metaTitle")}
        description={t("transferHistory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:transferHistory")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <h3 className="mb-4 font-semibold">{t("common:transfers.transferHistory")}</h3>
        <TransferHistoryTable
          transfers={transfers}
          showPurchaser={false}
          showCreator
          emptyMessage={t("transferHistory.empty")}
        />
      </div>
    </div>
  );
}
