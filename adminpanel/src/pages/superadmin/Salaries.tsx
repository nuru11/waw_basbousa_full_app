import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import {
  DataTable,
  EmptyState,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { api, type PayrollEmployee, type PayrollOverview } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  currentMonthInput,
  formatPaidDate,
  formatPayPeriodLabel,
} from "../../utils/expenseCategory";
import { translateApiError } from "../../utils/translateApiError";

function getSalaryDraft(
  emp: PayrollEmployee,
  salaryDrafts: Record<number, string>
) {
  const saved = emp.monthly_salary != null ? String(emp.monthly_salary) : "";
  const draft = salaryDrafts[emp.id] ?? saved;
  return { saved, draft, dirty: draft !== saved };
}

export default function SalariesPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [period, setPeriod] = useState(currentMonthInput());
  const [payroll, setPayroll] = useState<PayrollOverview | null>(null);
  const [salaryDrafts, setSalaryDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .get<PayrollOverview>(`/salaries?period=${period}`)
      .then((data) => {
        setPayroll(data);
        const drafts: Record<number, string> = {};
        for (const emp of data.employees) {
          drafts[emp.id] =
            emp.monthly_salary != null ? String(emp.monthly_salary) : "";
        }
        setSalaryDrafts(drafts);
      })
      .catch((e) => setError(translateApiError(e)))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveSalary(employee: PayrollEmployee) {
    const draft = salaryDrafts[employee.id] ?? "";
    const amount = parseFloat(draft);
    if (!amount || amount <= 0) {
      setError(t("salaries.salaryRequired"));
      return;
    }

    setSavingId(employee.id);
    setError("");
    setSuccess("");
    try {
      await api.put(`/salaries/employees/${employee.id}/salary`, {
        monthly_salary: amount,
      });
      setSuccess(t("salaries.salarySaved", { name: employee.name }));
      load();
    } catch (e) {
      setError(translateApiError(e));
    } finally {
      setSavingId(null);
    }
  }

  async function handleMarkPaid(employee: PayrollEmployee) {
    if (
      !window.confirm(
        t("salaries.payConfirm", {
          name: employee.name,
          amount: formatCurrency(employee.monthly_salary ?? 0),
          period: formatPayPeriodLabel(period),
        })
      )
    ) {
      return;
    }

    setPayingId(employee.id);
    setError("");
    setSuccess("");
    try {
      await api.post(`/salaries/employees/${employee.id}/pay`, { period });
      setSuccess(t("salaries.paidSuccess", { name: employee.name }));
      load();
    } catch (e) {
      setError(translateApiError(e));
    } finally {
      setPayingId(null);
    }
  }

  function renderSalaryControls(
    emp: PayrollEmployee,
    layout: "table" | "mobile" = "table"
  ) {
    const { draft, dirty } = getSalaryDraft(emp, salaryDrafts);
    const isSaving = savingId === emp.id;

    return (
      <div
        className={
          layout === "mobile"
            ? "flex flex-col gap-2"
            : "flex items-center gap-2"
        }
      >
        <Input
          type="number"
          step={0.01}
          inputMode="decimal"
          value={draft}
          disabled={isSaving}
          onChange={(e) =>
            setSalaryDrafts((prev) => ({
              ...prev,
              [emp.id]: e.target.value,
            }))
          }
          className={layout === "mobile" ? "w-full min-w-0" : "w-28"}
        />
        <Button
          type="button"
          size="sm"
          disabled={!dirty || isSaving}
          onClick={() => handleSaveSalary(emp)}
          className={layout === "mobile" ? "w-full" : undefined}
        >
          {isSaving ? tCommon("actions.saving") : t("salaries.saveSalary")}
        </Button>
        {emp.payment && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("salaries.paidPeriodAmount", {
              amount: formatCurrency(emp.payment.amount),
            })}
          </p>
        )}
      </div>
    );
  }

  function renderMarkPaidButton(emp: PayrollEmployee, fullWidth = false) {
    const canPay =
      emp.monthly_salary != null &&
      emp.monthly_salary > 0 &&
      !emp.payment;

    return (
      <Button
        type="button"
        size="sm"
        disabled={!canPay || payingId === emp.id}
        onClick={() => handleMarkPaid(emp)}
        className={fullWidth ? "w-full" : undefined}
      >
        {payingId === emp.id ? t("salaries.paying") : t("salaries.markPaid")}
      </Button>
    );
  }

  const columns: DataTableColumn<PayrollEmployee>[] = useMemo(
    () => [
      {
        key: "employee",
        header: tCommon("fields.name"),
        render: (emp) => (
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">{emp.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {emp.short_id}
            </p>
          </div>
        ),
      },
      {
        key: "salary",
        header: t("salaries.monthlySalary"),
        render: (emp) => renderSalaryControls(emp, "table"),
      },
      {
        key: "status",
        header: tCommon("fields.status"),
        render: (emp) => (
          <StatusBadge variant={emp.payment ? "received" : "pending"}>
            {emp.payment ? t("salaries.paid") : t("salaries.pending")}
          </StatusBadge>
        ),
      },
      {
        key: "paidOn",
        header: t("salaries.paidOn"),
        render: (emp) =>
          emp.payment ? formatPaidDate(emp.payment.paid_at) : tCommon("emDash"),
      },
      {
        key: "action",
        header: tCommon("fields.action"),
        render: (emp) => renderMarkPaidButton(emp),
      },
    ],
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tCommon, salaryDrafts, savingId, payingId, period]
  );

  return (
    <div>
      <PageMeta
        title={t("salaries.metaTitle")}
        description={t("salaries.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("salaries")} />

      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {success && <p className="mb-4 text-sm text-success-500">{success}</p>}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <Label>{t("salaries.payPeriod")}</Label>
          <Input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-44"
          />
        </div>
        <p className="pb-2 text-sm text-gray-500 dark:text-gray-400">
          {t("salaries.payrollHint")}
        </p>
      </div>

      {payroll && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("salaries.totalPayroll")}
            value={formatCurrency(payroll.summary.total_payroll)}
            subtitle={formatPayPeriodLabel(period)}
            accent="brand"
          />
          <StatCard
            title={t("salaries.paidCount")}
            value={String(payroll.summary.paid_count)}
            accent="success"
          />
          <StatCard
            title={t("salaries.pendingCount")}
            value={String(payroll.summary.pending_count)}
            accent="warning"
          />
          <StatCard
            title={t("salaries.amountPaid")}
            value={formatCurrency(payroll.summary.paid_amount)}
            accent="orange"
          />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{tCommon("loading")}</p>
      ) : payroll && payroll.employees.length === 0 ? (
        <EmptyState message={t("salaries.noEmployees")} />
      ) : (
        payroll && (
          <SectionCard
            title={t("salaries.employeeList")}
            count={tCommon("periodFilters.entryCount", {
              count: payroll.employees.length,
            })}
          >
            <div className="md:hidden space-y-4">
              {payroll.employees.map((emp) => (
                <div
                  key={emp.id}
                  className="rounded-xl border border-gray-200 p-4 dark:border-white/[0.08]"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {emp.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {emp.short_id}
                      </p>
                    </div>
                    <StatusBadge variant={emp.payment ? "received" : "pending"}>
                      {emp.payment ? t("salaries.paid") : t("salaries.pending")}
                    </StatusBadge>
                  </div>

                  <div className="mb-3">
                    <Label>{t("salaries.monthlySalary")}</Label>
                    {renderSalaryControls(emp, "mobile")}
                  </div>

                  <div className="mb-3 flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {t("salaries.paidOn")}
                    </span>
                    <span className="text-gray-800 dark:text-white/90">
                      {emp.payment
                        ? formatPaidDate(emp.payment.paid_at)
                        : tCommon("emDash")}
                    </span>
                  </div>

                  {renderMarkPaidButton(emp, true)}
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <DataTable
                columns={columns}
                data={payroll.employees}
                keyExtractor={(emp) => emp.id}
                hoverRows
              />
            </div>
          </SectionCard>
        )
      )}
    </div>
  );
}
