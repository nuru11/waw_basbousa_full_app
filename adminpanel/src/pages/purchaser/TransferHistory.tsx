import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import TransferHistoryTable from "../../components/transfers/TransferHistoryTable";
import { api, type Transfer } from "../../services/api";

export default function PurchaserTransferHistoryPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Transfer[]>("/transfers?status=accepted")
      .then(setTransfers)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageMeta title="Transfer History | Restaurant" description="Past transfers" />
      <PageBreadcrumb pageTitle="Transfer History" />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <h3 className="mb-4 font-semibold">Transfer History</h3>
        <TransferHistoryTable
          transfers={transfers}
          showPurchaser={false}
          showCreator
          emptyMessage="No accepted transfers yet"
        />
      </div>
    </div>
  );
}
