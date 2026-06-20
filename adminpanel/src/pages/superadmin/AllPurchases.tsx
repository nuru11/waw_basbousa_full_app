import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchasesTable from "../../components/purchases/PurchasesTable";
import { SectionCard } from "../../components/ui";
import { api, type Purchase } from "../../services/api";
import { translateApiError } from "../../utils/translateApiError";

const PERIODS = ["all", "today", "yesterday", "week", "month", "quarter"] as const;
type PurchasePeriod = (typeof PERIODS)[number];

export default function AllPurchasesPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [period, setPeriod] = useState<PurchasePeriod>("all");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    const query = period === "all" ? "/purchases" : `/purchases?period=${period}`;
    api
      .get<Purchase[]>(query)
      .then(setPurchases)
      .catch((e) => setError(translateApiError(e)))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div>
      <PageMeta
        title={t("allPurchases.metaTitle")}
        description={t("allPurchases.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("allPurchases")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}

      <div className="mb-4 flex flex-wrap gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
        {PERIODS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={`rounded-md px-3 py-2 text-theme-sm font-medium hover:text-gray-900 dark:hover:text-white ${
              period === value
                ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {tCommon(`periodFilters.${value}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{tCommon("loading")}</p>
      ) : (
        <SectionCard
          title={t("allPurchases.title")}
          count={tCommon("periodFilters.entryCount", { count: purchases.length })}
        >
          <PurchasesTable
            purchases={purchases}
            showUnitPrice
            emptyMessage={t("allPurchases.empty")}
          />
        </SectionCard>
      )}
    </div>
  );
}
