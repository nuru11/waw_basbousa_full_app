import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  DataTable,
  paymentMethodVariant,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { api, type Sale } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { paymentMethodLabel, weightTypeLabel } from "../../utils/purchaseStatus";

export default function MySalesPage() {
  const { t } = useTranslation(["employee", "common", "nav"]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    api.get<Sale[]>("/sales/mine").then(setSales);
  }, []);

  const total = sales.reduce((sum, s) => sum + parseFloat(String(s.total_price)), 0);

  const columns: DataTableColumn<Sale>[] = useMemo(
    () => [
      {
        key: "plate",
        header: t("common:fields.plate"),
        render: (s) => s.dish?.name ?? t("common:emDash"),
      },
      {
        key: "type",
        header: t("common:fields.type"),
        render: (s) =>
          `${weightTypeLabel(s.weight_type)}${
            s.slice_count
              ? t("common:units.slicesInSale", { count: s.slice_count })
              : ""
          }`,
      },
      {
        key: "qty",
        header: t("common:fields.qty"),
        render: (s) => s.quantity,
      },
      {
        key: "payment",
        header: t("common:fields.payment"),
        render: (s) => (
          <StatusBadge variant={paymentMethodVariant(s.payment_method)}>
            {paymentMethodLabel(s.payment_method)}
          </StatusBadge>
        ),
      },
      {
        key: "total",
        header: t("common:fields.total"),
        render: (s) => formatCurrency(parseFloat(String(s.total_price))),
      },
      {
        key: "date",
        header: t("common:fields.date"),
        render: (s) => new Date(s.sold_at).toLocaleString(),
      },
    ],
    [t]
  );

  return (
    <div>
      <PageMeta title={t("mySales.metaTitle")} description={t("mySales.metaDescription")} />
      <PageBreadcrumb pageTitle={t("nav:mySales")} />
      <div className="mb-6">
        <StatCard
          title={t("common:fields.total")}
          value={formatCurrency(total)}
          accent="success"
        />
      </div>
      <SectionCard title={t("nav:mySales")}>
        <DataTable
          columns={columns}
          data={sales}
          keyExtractor={(s) => s.id}
          hoverRows
        />
      </SectionCard>
    </div>
  );
}
