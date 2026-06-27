import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { DataTable, SectionCard } from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { getIntlLocale } from "../../i18n";
import { api, type TodayPlateRow, type TodayPlatesOverview } from "../../services/api";
import { formatShortDate } from "../../utils/formatDate";
import { formatNumber } from "../../utils/formatNumber";
import { translateApiError } from "../../utils/translateApiError";

export default function TodaysPlatesPage() {
  const { t } = useTranslation(["chief", "common", "nav"]);
  const [data, setData] = useState<TodayPlatesOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const todayLabel = new Date().toLocaleDateString(getIntlLocale(), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const columns: DataTableColumn<TodayPlateRow>[] = useMemo(
    () => [
      {
        key: "plate",
        header: t("common:fields.plate"),
        render: (row) => (
          <span className="font-medium text-gray-800 dark:text-white/90">
            {row.dish_name ?? t("common:plateFallback", { id: row.dish_id })}
          </span>
        ),
      },
      {
        key: "date",
        header: t("common:fields.date"),
        cellClassName: "whitespace-nowrap",
        render: (row) => formatShortDate(row.date),
      },
      {
        key: "producedKg",
        header: t("common:sales.producedKg"),
        render: (row) => formatNumber(row.produced_kg),
      },
      {
        key: "platesCooked",
        header: t("common:sales.platesCooked"),
        render: (row) => row.produced_plates,
      },
    ],
    [t]
  );

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get<TodayPlatesOverview>("/stock/plates/today")
      .then(setData)
      .catch((e) => setError(translateApiError(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageMeta
        title={t("todaysPlates.metaTitle")}
        description={t("todaysPlates.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:todaysPlates")} subtitle={todayLabel} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">
          {t("common:loadingTodayActivity")}
        </p>
      ) : (
        <>
          {data?.summary && (
            <SectionCard title={t("todaysPlates.sharedPoolTitle")} className="mb-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t("common:sales.producedKg")}
                  </p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white/90">
                    {formatNumber(data.summary.produced_kg)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t("common:sales.soldKgCol")}
                  </p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white/90">
                    {formatNumber(data.summary.sold_kg)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t("common:sales.remainingKg")}
                  </p>
                  <p className="text-xl font-bold text-brand-600 dark:text-brand-400">
                    {formatNumber(data.summary.remaining_kg)}
                  </p>
                </div>
              </div>
            </SectionCard>
          )}
          <SectionCard
            title={t("todaysPlates.title")}
            count={t("common:todayCount", { count: data?.plates.length ?? 0 })}
          >
            <DataTable
              columns={columns}
              data={data?.plates ?? []}
              keyExtractor={(row) => row.dish_id ?? row.dish_name ?? row.date}
              emptyMessage={t("common:sales.noProductionOrSales")}
              hoverRows
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}
