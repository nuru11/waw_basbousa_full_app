import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ExpensesTable from "../../components/expenses/ExpensesTable";
import {
  DataTable,
  purchaseStatusVariant,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { api, type Expense, type Purchase, type ReportSummary, type Sale } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { purchaseStatusLabel, formatSaleItemName, formatSalePortion } from "../../utils/purchaseStatus";

export default function ReportsPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    api.get<ReportSummary>("/reports/summary").then(setSummary);
    api.get<Purchase[]>("/reports/purchases").then(setPurchases);
    api.get<Expense[]>("/reports/expenses").then(setExpenses);
    api.get<Sale[]>("/reports/sales").then(setSales);
  }, []);

  const purchaseColumns: DataTableColumn<Purchase>[] = useMemo(
    () => [
      {
        key: "id",
        header: tCommon("fields.id"),
        render: (p) => tCommon("idShort", { id: p.id }),
      },
      {
        key: "item",
        header: tCommon("fields.item"),
        render: (p) => p.ingredient?.name ?? tCommon("emDash"),
      },
      {
        key: "qty",
        header: tCommon("fields.qty"),
        render: (p) => formatNumber(p.quantity),
      },
      {
        key: "unitPrice",
        header: tCommon("fields.unitPrice"),
        render: (p) => formatCurrency(parseFloat(String(p.unit_price))),
      },
      {
        key: "total",
        header: tCommon("fields.total"),
        render: (p) => formatCurrency(parseFloat(String(p.total_price))),
      },
      {
        key: "status",
        header: tCommon("fields.status"),
        render: (p) => (
          <StatusBadge variant={purchaseStatusVariant(p.status)}>
            {purchaseStatusLabel(p.status)}
          </StatusBadge>
        ),
      },
    ],
    [tCommon]
  );

  const salesColumns: DataTableColumn<Sale>[] = useMemo(
    () => [
      {
        key: "plate",
        header: tCommon("fields.plate"),
        render: (s) => formatSaleItemName(s),
      },
      {
        key: "seller",
        header: tCommon("fields.seller"),
        render: (s) => s.seller?.name ?? tCommon("emDash"),
      },
      {
        key: "type",
        header: tCommon("fields.type"),
        render: (s) => formatSalePortion(s),
      },
      {
        key: "total",
        header: tCommon("fields.total"),
        render: (s) => formatCurrency(parseFloat(String(s.total_price))),
      },
    ],
    [tCommon]
  );

  return (
    <div>
      <PageMeta title={t("reports.metaTitle")} description={t("reports.metaDescription")} />
      <PageBreadcrumb pageTitle={tNav("reports")} />

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("reports.totalIncome")}
            value={formatCurrency(summary.income)}
            accent="brand"
          />
          <StatCard
            title={t("reports.ingredientExpense")}
            value={formatCurrency(summary.ingredient_expense ?? summary.expense)}
            accent="orange"
          />
          <StatCard
            title={t("reports.operatingExpense")}
            value={formatCurrency(summary.operating_expense ?? 0)}
            accent="warning"
          />
          <StatCard
            title={t("reports.netProfit")}
            value={formatCurrency(summary.net_profit)}
            accent={summary.net_profit >= 0 ? "success" : "error"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard title={t("reports.salesIncome")}>
          <DataTable
            columns={salesColumns}
            data={sales}
            keyExtractor={(s) => s.id}
            hoverRows
          />
        </SectionCard>
        <SectionCard title={t("reports.ingredientPurchases")}>
          <DataTable
            columns={purchaseColumns}
            data={purchases}
            keyExtractor={(p) => p.id}
            hoverRows
          />
        </SectionCard>
        <SectionCard title={t("reports.operatingExpenses")}>
          <ExpensesTable
            expenses={expenses}
            emptyMessage={t("reports.noOperatingExpenses")}
          />
        </SectionCard>
      </div>
    </div>
  );
}
