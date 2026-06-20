import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SalesDailyReport from "../../components/sales/SalesDailyReport";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { getIntlLocale } from "../../i18n";
import { api, type DailySalesOverview } from "../../services/api";
import { translateApiError } from "../../utils/translateApiError";

function todayInputValue() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function SalesHistoryPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [date, setDate] = useState(todayInputValue);
  const [data, setData] = useState<DailySalesOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(selectedDate: string) {
    setLoading(true);
    setError("");
    try {
      const result = await api.get<DailySalesOverview>(
        `/reports/sales/daily?date=${selectedDate}`
      );
      setData(result);
    } catch (e) {
      setError(translateApiError(e, "admin:salesHistory.failedToLoad"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    load(date);
  }

  const dateLabel = data
    ? new Date(data.date + "T12:00:00").toLocaleDateString(getIntlLocale(), {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div>
      <PageMeta
        title={t("salesHistory.metaTitle")}
        description={t("salesHistory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("salesHistory")} />
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-4 p-5 mb-6 rounded-2xl border border-gray-200 dark:border-gray-800"
      >
        <div>
          <Label>{tCommon("fields.selectDate")}</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? tCommon("loading") : tCommon("actions.loadReport")}
        </Button>
      </form>
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {data && (
        <>
          {dateLabel && <p className="mb-4 text-sm text-gray-500">{dateLabel}</p>}
          <SalesDailyReport data={data} />
        </>
      )}
      {!data && !loading && !error && (
        <p className="text-gray-500">{t("salesHistory.pickDatePrompt")}</p>
      )}
    </div>
  );
}
