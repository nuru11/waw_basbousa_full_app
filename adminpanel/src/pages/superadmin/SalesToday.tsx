import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SalesDailyReport from "../../components/sales/SalesDailyReport";
import { getIntlLocale } from "../../i18n";
import { api, type DailySalesOverview } from "../../services/api";
import { translateApiError } from "../../utils/translateApiError";

export default function SalesTodayPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [data, setData] = useState<DailySalesOverview | null>(null);
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
    api
      .get<DailySalesOverview>("/reports/sales/daily")
      .then(setData)
      .catch((e) => setError(translateApiError(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageMeta
        title={t("salesToday.metaTitle")}
        description={t("salesToday.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("salesTodayTitle")} />
      <p className="mb-4 text-sm text-gray-500">{todayLabel}</p>
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500">{tCommon("loadingTodaySales")}</p>
      ) : data ? (
        <SalesDailyReport data={data} />
      ) : null}
    </div>
  );
}
