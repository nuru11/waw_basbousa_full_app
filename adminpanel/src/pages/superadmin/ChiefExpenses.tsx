import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import {
  DataTable,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import {
  api,
  type ChiefExpense,
  type ChiefExpenseCategory,
  type ChiefExpenseSummary,
  type User,
} from "../../services/api";
import {
  CHIEF_EXPENSE_CATEGORIES,
  chiefExpenseCategoryLabel,
  chiefExpenseCategoryVariant,
} from "../../utils/chiefExpenseCategory";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatSpentDate, todayDateInput } from "../../utils/expenseCategory";
import { translateApiError } from "../../utils/translateApiError";

const PERIODS = ["week", "month"] as const;
type ListPeriod = (typeof PERIODS)[number];

export default function ChiefExpensesPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [period, setPeriod] = useState<ListPeriod>("month");
  const [expenses, setExpenses] = useState<ChiefExpense[]>([]);
  const [summary, setSummary] = useState<ChiefExpenseSummary | null>(null);
  const [chiefs, setChiefs] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [category, setCategory] = useState<ChiefExpenseCategory>("food");
  const [form, setForm] = useState({
    amount: "",
    description: "",
    chief_id: "",
    spent_at: todayDateInput(),
  });
  const { submitting, run } = useSubmitLock();

  const load = useCallback(() => {
    setError("");
    api
      .get<ChiefExpense[]>(`/chief-expenses?period=${period}`)
      .then(setExpenses)
      .catch((e) => setError(translateApiError(e)));
    api
      .get<ChiefExpenseSummary>("/chief-expenses/summary?period=month")
      .then(setSummary)
      .catch((e) => setError(translateApiError(e)));
    api
      .get<User[]>("/admins")
      .then((admins) =>
        setChiefs(admins.filter((a) => a.role === "chief" && a.status === "active"))
      )
      .catch((e) => setError(translateApiError(e)));
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      setError("");
      setSuccess("");

      const amount = parseFloat(form.amount);
      if (!amount || amount <= 0) {
        setError(t("chiefExpenses.amountRequired"));
        return;
      }

      if (!form.chief_id) {
        setError(t("chiefExpenses.chiefRequired"));
        return;
      }

      if (category === "other" && !form.description.trim()) {
        setError(t("chiefExpenses.descriptionRequired"));
        return;
      }

      try {
        await api.post("/chief-expenses", {
          amount,
          chief_id: parseInt(form.chief_id, 10),
          category,
          description: form.description.trim() || undefined,
          spent_at: form.spent_at,
        });
        setSuccess(t("chiefExpenses.recordedSuccess"));
        setForm({ amount: "", description: "", chief_id: "", spent_at: todayDateInput() });
        setCategory("food");
        load();
      } catch (err: unknown) {
        setError(translateApiError(err, "common:failed"));
      }
    });
  }

  async function handleDelete(expense: ChiefExpense) {
    if (!window.confirm(t("chiefExpenses.deleteConfirm"))) return;

    setDeletingId(expense.id);
    setError("");
    try {
      await api.delete(`/chief-expenses/${expense.id}`);
      load();
    } catch (e) {
      setError(translateApiError(e));
    } finally {
      setDeletingId(null);
    }
  }

  const columns: DataTableColumn<ChiefExpense>[] = useMemo(
    () => [
      {
        key: "date",
        header: tCommon("fields.date"),
        render: (row) => formatSpentDate(row.spent_at),
      },
      {
        key: "chief",
        header: tCommon("fields.chief"),
        render: (row) => row.chief?.name ?? `#${row.chief_id}`,
      },
      {
        key: "category",
        header: tCommon("fields.category"),
        render: (row) => (
          <StatusBadge variant={chiefExpenseCategoryVariant(row.category)}>
            {chiefExpenseCategoryLabel(row.category, t)}
          </StatusBadge>
        ),
      },
      {
        key: "amount",
        header: tCommon("fields.amount"),
        render: (row) => formatCurrency(parseFloat(String(row.amount))),
      },
      {
        key: "description",
        header: tCommon("fields.description"),
        render: (row) => row.description ?? "—",
      },
      {
        key: "creator",
        header: t("chiefExpenses.recordedBy"),
        render: (row) => row.creator?.name ?? "—",
      },
      {
        key: "actions",
        header: tCommon("fields.actions"),
        render: (row) => (
          <Button
            size="sm"
            variant="outline"
            disabled={deletingId === row.id}
            onClick={() => handleDelete(row)}
          >
            {deletingId === row.id ? tCommon("actions.deleting") : tCommon("actions.delete")}
          </Button>
        ),
      },
    ],
    [t, tCommon, deletingId]
  );

  return (
    <div>
      <PageMeta
        title={t("chiefExpenses.metaTitle")}
        description={t("chiefExpenses.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("chiefExpenses")} />

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("chiefExpenses.totalThisMonth")}
            value={formatCurrency(summary.total)}
            subtitle={t("chiefExpenses.entryCount", { count: summary.count })}
            accent="orange"
          />
          {CHIEF_EXPENSE_CATEGORIES.map((cat) => (
            <StatCard
              key={cat}
              title={chiefExpenseCategoryLabel(cat, t)}
              value={formatCurrency(summary.by_category[cat])}
              accent="brand"
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title={t("chiefExpenses.recordTitle")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-error-500">{error}</p>}
            {success && <p className="text-sm text-success-500">{success}</p>}

            <div>
              <Label>{tCommon("fields.category")}</Label>
              <div className="mt-2 flex flex-wrap gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                {CHIEF_EXPENSE_CATEGORIES.map((cat) => (
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
                    {chiefExpenseCategoryLabel(cat, t)}
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
              <Label>{t("chiefExpenses.toChief")}</Label>
              <Select
                value={form.chief_id}
                onChange={(chief_id) => setForm({ ...form, chief_id })}
                placeholder={tCommon("fields.selectChief")}
                options={chiefs.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
              />
            </div>

            <div>
              <Label>{t("chiefExpenses.spentDate")}</Label>
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
                placeholder={t("chiefExpenses.descriptionPlaceholder")}
              />
            </div>

            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? tCommon("actions.submitting") : t("chiefExpenses.recordButton")}
            </Button>
          </form>
        </SectionCard>

        <SectionCard
          title={t("chiefExpenses.historyTitle")}
          className="lg:col-span-2"
          count={tCommon("periodFilters.entryCount", { count: expenses.length })}
        >
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

          <DataTable
            columns={columns}
            data={expenses}
            keyExtractor={(row) => row.id}
            emptyMessage={t("chiefExpenses.historyEmpty")}
          />
        </SectionCard>
      </div>
    </div>
  );
}
