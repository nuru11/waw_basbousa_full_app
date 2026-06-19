import { useState, type FormEvent } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SalesDailyReport from "../../components/sales/SalesDailyReport";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { api, type DailySalesOverview } from "../../services/api";

function todayInputValue() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function SalesHistoryPage() {
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
      setError(e instanceof Error ? e.message : "Failed to load");
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
    ? new Date(data.date + "T12:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div>
      <PageMeta title="Sales History | Restaurant" description="Sales by date" />
      <PageBreadcrumb pageTitle="Sales History" />
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-4 p-5 mb-6 rounded-2xl border border-gray-200 dark:border-gray-800"
      >
        <div>
          <Label>Select date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Loading..." : "Load report"}
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
        <p className="text-gray-500">Pick a date and load the sales report.</p>
      )}
    </div>
  );
}
