import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
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

  return (
    <div>
      <PageMeta title={t("reports.metaTitle")} description={t("reports.metaDescription")} />
      <PageBreadcrumb pageTitle={tNav("reports")} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
          <h3 className="mb-4 font-semibold">{t("reports.purchasesExpenses")}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                <th className="pb-2">{tCommon("fields.id")}</th>
                <th className="pb-2">{tCommon("fields.item")}</th>
                <th className="pb-2">{tCommon("fields.qty")}</th>
                <th className="pb-2">{tCommon("fields.unitPrice")}</th>
                <th className="pb-2">{tCommon("fields.total")}</th>
                <th className="pb-2">{tCommon("fields.status")}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2">{tCommon("idShort", { id: p.id })}</td>
                  <td className="py-2">{p.ingredient?.name}</td>
                  <td className="py-2">{formatNumber(p.quantity)}</td>
                  <td className="py-2">{formatCurrency(parseFloat(String(p.unit_price)))}</td>
                  <td className="py-2">{formatCurrency(parseFloat(String(p.total_price)))}</td>
                  <td className="py-2">{purchaseStatusLabel(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
          <h3 className="mb-4 font-semibold">{t("reports.salesIncome")}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                <th className="pb-2">{tCommon("fields.plate")}</th>
                <th className="pb-2">{tCommon("fields.seller")}</th>
                <th className="pb-2">{tCommon("fields.type")}</th>
                <th className="pb-2">{tCommon("fields.total")}</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2">{s.dish?.name}</td>
                  <td className="py-2">{s.seller?.name}</td>
                  <td className="py-2">{weightTypeLabel(s.weight_type)}</td>
                  <td className="py-2">{formatCurrency(parseFloat(String(s.total_price)))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
