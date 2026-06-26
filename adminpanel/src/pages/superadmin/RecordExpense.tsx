import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { SectionCard, StatCard } from "../../components/ui";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type ExpenseSummary } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { translateApiError } from "../../utils/translateApiError";
import {
  EXPENSE_CATEGORIES,
  RECORD_EXPENSE_CATEGORIES,
  expenseCategoryLabel,
  todayDateInput,
} from "../../utils/expenseCategory";

type RecordCategory = (typeof RECORD_EXPENSE_CATEGORIES)[number];

export default function RecordExpensePage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [category, setCategory] = useState<RecordCategory>("rental");
  const [form, setForm] = useState({
    amount: "",
    description: "",
    spent_at: todayDateInput(),
  });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { submitting, run } = useSubmitLock();

  const load = () => {
    api.get<ExpenseSummary>("/expenses/summary?period=month").then(setSummary);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!receipt) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(receipt);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [receipt]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      setError("");
      setSuccess("");

      const amount = parseFloat(form.amount);
      if (!amount || amount <= 0) {
        setError(t("expenses.amountRequired"));
        return;
      }

      if (category === "other" && !form.description.trim()) {
        setError(t("expenses.descriptionRequired"));
        return;
      }

      try {
        const formData = new FormData();
        formData.append("category", category);
        formData.append("amount", form.amount);
        formData.append("spent_at", form.spent_at);
        if (form.description.trim()) {
          formData.append("description", form.description.trim());
        }
        if (receipt) {
          formData.append("receipt", receipt);
        }

        await api.postForm("/expenses", formData);
        setSuccess(t("expenses.recordedSuccess"));
        setForm({ amount: "", description: "", spent_at: todayDateInput() });
        setReceipt(null);
        load();
      } catch (err: unknown) {
        setError(translateApiError(err));
      }
    });
  }

  return (
    <div>
      <PageMeta
        title={t("expenses.recordMetaTitle")}
        description={t("expenses.recordMetaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("recordExpense")} />

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title={t("expenses.totalThisMonth")}
            value={formatCurrency(summary.total)}
            accent="orange"
          />
          {EXPENSE_CATEGORIES.map((cat) => (
            <StatCard
              key={cat}
              title={expenseCategoryLabel(cat, t)}
              value={formatCurrency(summary.by_category[cat])}
              accent="brand"
            />
          ))}
        </div>
      )}

      <SectionCard title={t("expenses.recordTitle")} className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-error-500">{error}</p>}
          {success && <p className="text-sm text-success-500">{success}</p>}

          <div>
            <Label>{tCommon("fields.category")}</Label>
            <div className="mt-2 flex flex-wrap gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
              {RECORD_EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-md px-3 py-2 text-theme-sm font-medium hover:text-gray-900 dark:hover:text-white ${
                    category === cat
                      ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {expenseCategoryLabel(cat, t)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>{tCommon("fields.amount")} ({tCommon("etb")})</Label>
            <Input
              type="number"
              step={0.01}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>

          <div>
            <Label>{t("expenses.spentDate")}</Label>
            <Input
              type="date"
              value={form.spent_at}
              onChange={(e) => setForm({ ...form, spent_at: e.target.value })}
            />
          </div>

          <div>
            <Label>
              {tCommon("fields.description")}
              {category === "other" ? ` ${tCommon("required")}` : ` (${tCommon("optional")})`}
            </Label>
            <Input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t("expenses.descriptionPlaceholder")}
            />
          </div>

          <div>
            <Label>{t("expenses.receiptLabel")} ({tCommon("optional")})</Label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 dark:file:bg-gray-800 dark:file:text-gray-300"
              onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
            />
            {previewUrl && (
              <img
                src={previewUrl}
                alt={tCommon("screenshotPreviewAlt")}
                className="mt-2 max-h-32 rounded-lg border border-gray-200 dark:border-gray-700"
              />
            )}
          </div>

          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? tCommon("actions.submitting") : t("expenses.recordButton")}
          </Button>

          <p className="text-sm space-y-1">
            <Link
              to="/admin/salaries"
              className="block text-brand-500 hover:underline"
            >
              {t("expenses.manageSalariesLink")}
            </Link>
            <Link
              to="/admin/expenses/history"
              className="block text-brand-500 hover:underline"
            >
              {t("expenses.viewHistoryLink")}
            </Link>
          </p>
        </form>
      </SectionCard>
    </div>
  );
}
