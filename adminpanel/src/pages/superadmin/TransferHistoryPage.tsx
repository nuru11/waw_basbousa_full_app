import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import TransferHistoryTable from "../../components/transfers/TransferHistoryTable";
import { SectionCard } from "../../components/ui";
import { api, type Transfer } from "../../services/api";
import { translateApiError } from "../../utils/translateApiError";

export default function TransferHistoryPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Transfer[]>("/transfers?period=history")
      .then(setTransfers)
      .catch((e) => setError(translateApiError(e)));
  }, []);

  return (
    <div>
      <PageMeta
        title={t("transferHistory.metaTitle")}
        description={t("transferHistory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("transferHistory")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <SectionCard title={tCommon("transfers.transferHistory")}>
        <TransferHistoryTable
          transfers={transfers}
          emptyMessage={t("transferHistory.noBeforeWeek")}
        />
      </SectionCard>
    </div>
  );
}
