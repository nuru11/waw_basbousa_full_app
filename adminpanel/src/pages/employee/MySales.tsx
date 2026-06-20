import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
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

  return (
    <div>
      <PageMeta title={t("mySales.metaTitle")} description={t("mySales.metaDescription")} />
      <PageBreadcrumb pageTitle={t("nav:mySales")} />
      <p className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        {t("common:sales.totalSold", { amount: formatCurrency(total) })}
      </p>
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-start text-gray-500 border-b dark:border-gray-700">
              <th className="pb-3">{t("common:fields.plate")}</th>
              <th className="pb-3">{t("common:fields.type")}</th>
              <th className="pb-3">{t("common:fields.qty")}</th>
              <th className="pb-3">{t("common:fields.payment")}</th>
              <th className="pb-3">{t("common:fields.total")}</th>
              <th className="pb-3">{t("common:fields.date")}</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3">{s.dish?.name}</td>
                <td className="py-3">
                  {weightTypeLabel(s.weight_type)}
                  {s.slice_count
                    ? t("common:units.slicesInSale", { count: s.slice_count })
                    : ""}
                </td>
                <td className="py-3">{s.quantity}</td>
                <td className="py-3">{paymentMethodLabel(s.payment_method)}</td>
                <td className="py-3">{formatCurrency(parseFloat(String(s.total_price)))}</td>
                <td className="py-3">{new Date(s.sold_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
