import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  DataTable,
  purchaseStatusVariant,
  SectionCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { api, type Purchase, type Sale } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { purchaseStatusLabel, weightTypeLabel } from "../../utils/purchaseStatus";

export default function ReportsPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    api.get<Purchase[]>("/reports/purchases").then(setPurchases);
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
        render: (s) => s.dish?.name ?? tCommon("emDash"),
      },
      {
        key: "seller",
        header: tCommon("fields.seller"),
        render: (s) => s.seller?.name ?? tCommon("emDash"),
      },
      {
        key: "type",
        header: tCommon("fields.type"),
        render: (s) => weightTypeLabel(s.weight_type),
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={t("reports.purchasesExpenses")}>
          <DataTable
            columns={purchaseColumns}
            data={purchases}
            keyExtractor={(p) => p.id}
            hoverRows
          />
        </SectionCard>
        <SectionCard title={t("reports.salesIncome")}>
          <DataTable
            columns={salesColumns}
            data={sales}
            keyExtractor={(s) => s.id}
            hoverRows
          />
        </SectionCard>
      </div>
    </div>
  );
}
