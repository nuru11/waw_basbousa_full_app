import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { DataTable, SectionCard, StatCard } from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import {
  api,
  type Ingredient,
  type PlatesHistoryOverview,
  type TodayPlateRow,
  type TotalPlatePool,
} from "../../services/api";
import { formatShortDate } from "../../utils/formatDate";
import { formatNumber } from "../../utils/formatNumber";
import { translateApiError } from "../../utils/translateApiError";

export default function ProductionHistoryPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tChief } = useTranslation("chief");
  const { t: tNav } = useTranslation("nav");
  const [stock, setStock] = useState<Ingredient[]>([]);
  const [plates, setPlates] = useState<TodayPlateRow[]>([]);
  const [summary, setSummary] = useState<TotalPlatePool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const plateColumns: DataTableColumn<TodayPlateRow>[] = useMemo(
    () => [
      {
        key: "plate",
        header: tCommon("fields.plate"),
        render: (row) => (
          <span className="font-medium text-gray-800 dark:text-white/90">
            {row.dish_name ?? tCommon("plateFallback", { id: row.dish_id })}
          </span>
        ),
      },
      {
        key: "date",
        header: tCommon("fields.date"),
        cellClassName: "whitespace-nowrap",
        render: (row) => formatShortDate(row.date),
      },
      {
        key: "producedKg",
        header: tCommon("sales.producedKg"),
        render: (row) => formatNumber(row.produced_kg),
      },
      {
        key: "platesCooked",
        header: tCommon("sales.platesCooked"),
        render: (row) => row.produced_plates,
      },
    ],
    [tCommon]
  );

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      api.get<Ingredient[]>("/stock"),
      api.get<PlatesHistoryOverview>("/stock/plates/history"),
    ])
      .then(([stockData, platesData]) => {
        setStock(stockData);
        setPlates(platesData.plates);
        setSummary(platesData.summary ?? null);
      })
      .catch((e) => setError(translateApiError(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageMeta
        title={t("productionHistory.metaTitle")}
        description={t("productionHistory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("platesMadeByChief")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">
          {tCommon("loadingTodayActivity")}
        </p>
      ) : (
        <div className="space-y-6">
          <SectionCard title={t("productionHistory.chiefInventory")}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stock.map((item) => {
                const low =
                  parseFloat(String(item.current_stock)) <=
                  parseFloat(String(item.min_stock || 0));
                return (
                  <StatCard
                    key={item.id}
                    title={item.name}
                    value={`${formatNumber(item.current_stock)} ${item.unit}`}
                    subtitle={low ? tChief("inventory.lowStockAlert") : undefined}
                    accent={low ? "error" : "brand"}
                  />
                );
              })}
            </div>
          </SectionCard>

          {summary && (
            <SectionCard title={t("productionHistory.poolTotalsTitle")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {tCommon("sales.soldKgCol")}
                  </p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white/90">
                    {formatNumber(summary.sold_kg)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {tCommon("sales.remainingKg")}
                  </p>
                  <p className="text-xl font-bold text-brand-600 dark:text-brand-400">
                    {formatNumber(summary.remaining_kg)}
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard
            title={t("productionHistory.allPlatesMade")}
            count={t("productionHistory.plateRowCount", { count: plates.length })}
          >
            <DataTable
              columns={plateColumns}
              data={plates}
              keyExtractor={(row) => `${row.dish_id}-${row.date}`}
              emptyMessage={t("productionHistory.noPlatesLogged")}
              hoverRows
            />
          </SectionCard>
        </div>
      )}
    </div>
  );
}
