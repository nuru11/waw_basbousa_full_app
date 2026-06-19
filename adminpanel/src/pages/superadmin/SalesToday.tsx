import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SalesDailyReport from "../../components/sales/SalesDailyReport";
import { api, type DailySalesOverview } from "../../services/api";

export default function SalesTodayPage() {
  const [data, setData] = useState<DailySalesOverview | null>(null);
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
    api
      .get<DailySalesOverview>("/reports/sales/daily")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageMeta title="Today's Sales | Restaurant" description="Today's sales overview" />
      <PageBreadcrumb pageTitle="Sales — Today" />
      <p className="mb-4 text-sm text-gray-500">{todayLabel}</p>
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Loading today's sales...</p>
      ) : data ? (
        <SalesDailyReport data={data} />
      ) : null}
    </div>
  );
}
