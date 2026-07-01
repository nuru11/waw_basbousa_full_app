import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../ui/button/Button";
import SaleEditSheet from "./SaleEditSheet";
import { api, type Sale, type User } from "../../services/api";
import { paymentMethodLabel, weightTypeLabel } from "../../utils/labels";
import { formatCurrency } from "../../utils/formatCurrency";
import { translateApiError } from "../../utils/translateApiError";
import { portionColors, type WeightType } from "../../utils/posColors";

function formatSaleTime(soldAt: string) {
  return new Date(soldAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPortion(sale: Sale, t: (key: string, opts?: Record<string, unknown>) => string) {
  const label =
    sale.weight_type === "slice" && sale.slice_count
      ? t("common:units.slices", { count: sale.slice_count })
      : weightTypeLabel(sale.weight_type);
  if (sale.quantity > 1) {
    return `${label} × ${sale.quantity}`;
  }
  return label;
}

export default function TodaySalesList() {
  const { t } = useTranslation(["cashier", "common"]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<Sale[]>("/sales/today");
      setSales(data);
    } catch (err) {
      setError(translateApiError(err));
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
    api.get<User[]>("/sales/sellers").then(setSellers).catch(() => setSellers([]));
  }, [loadSales]);

  function handleSaved() {
    setSuccess(t("todaySales.saved"));
    loadSales();
    setTimeout(() => setSuccess(""), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="md" onClick={loadSales} disabled={loading}>
          {loading ? t("common:loading") : t("todaySales.refresh")}
        </Button>
      </div>

      {error && (
        <p className="p-3 text-sm font-medium border rounded-xl text-error-700 bg-error-50 border-error-200 dark:bg-error-500/15 dark:border-error-700 dark:text-error-300">
          {error}
        </p>
      )}

      {success && (
        <p className="p-3 text-sm font-medium border rounded-xl text-success-700 bg-success-50 border-success-200 dark:bg-success-500/15 dark:border-success-700 dark:text-success-300">
          {success}
        </p>
      )}

      {loading && sales.length === 0 ? (
        <p className="py-8 text-center text-gray-500 dark:text-gray-400">
          {t("common:loadingTodaySales")}
        </p>
      ) : sales.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed rounded-2xl border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">{t("todaySales.empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sales.map((sale) => {
            const tip = parseFloat(String(sale.tip_amount ?? 0));
            const total = parseFloat(String(sale.total_price)) + tip;
            const weightType = sale.weight_type as WeightType;

            return (
              <li key={sale.id}>
                <button
                  type="button"
                  onClick={() => setEditingSale(sale)}
                  className="w-full p-4 text-left transition border-2 rounded-xl border-gray-200 bg-white hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-700 touch-manipulation"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {formatSaleTime(sale.sold_at)}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-bold rounded-md ${portionColors[weightType].pill}`}
                        >
                          {formatPortion(sale, t)}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 truncate dark:text-white">
                        {sale.dish?.name ?? t("common:sales.generalSale")}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {sale.seller?.name ?? t("common:emDash")} ·{" "}
                        {paymentMethodLabel(sale.payment_method)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
                        {formatCurrency(total)}
                      </p>
                      {tip > 0 && (
                        <p className="text-xs text-gray-400">
                          {t("common:fields.tip")}: {formatCurrency(tip)}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-medium text-brand-500">
                        {t("common:actions.edit")} →
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <SaleEditSheet
        sale={editingSale}
        sellers={sellers}
        open={editingSale != null}
        onClose={() => setEditingSale(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}
