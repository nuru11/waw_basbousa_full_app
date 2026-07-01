import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Sale, type SaleUpdateRequest, type User } from "../../services/api";
import { paymentMethodLabel, weightTypeLabel } from "../../utils/labels";
import { formatCurrency } from "../../utils/formatCurrency";
import { translateApiError } from "../../utils/translateApiError";
import { paymentColors, portionColors, type WeightType } from "../../utils/posColors";
import { PAYMENT_OPTIONS } from "../../utils/paymentMethods";

const WEIGHT_OPTIONS: WeightType[] = ["quarter", "half", "kilo", "slice", "half_slice"];

function ChoiceButton({
  selected,
  onClick,
  children,
  colorClass,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  colorClass: { selected: string; idle: string };
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`touch-target rounded-xl border-2 px-3 py-3 text-sm font-semibold transition touch-manipulation md:py-4 md:text-base ${
        selected ? colorClass.selected : colorClass.idle
      } ${className}`}
    >
      {children}
    </button>
  );
}

interface SaleEditSheetProps {
  sale: Sale | null;
  sellers: User[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function SaleEditSheet({
  sale,
  sellers,
  open,
  onClose,
  onSaved,
}: SaleEditSheetProps) {
  const { t } = useTranslation(["cashier", "common"]);
  const { submitting, run } = useSubmitLock();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    weight_type: "kilo" as WeightType,
    quantity: "1",
    slice_count: "1",
    seller_id: "",
    payment_method: "cash",
    tip_amount: "",
  });

  useEffect(() => {
    if (!sale) return;
    setForm({
      weight_type: sale.weight_type,
      quantity: String(sale.quantity),
      slice_count: String(sale.slice_count ?? 1),
      seller_id: String(sale.seller_id),
      payment_method: sale.payment_method,
      tip_amount:
        sale.tip_amount != null && parseFloat(String(sale.tip_amount)) > 0
          ? String(sale.tip_amount)
          : "",
    });
    setError("");
  }, [sale]);

  useEffect(() => {
    if (form.payment_method === "cash" && form.tip_amount !== "") {
      setForm((prev) => ({ ...prev, tip_amount: "" }));
    }
  }, [form.payment_method, form.tip_amount]);

  if (!open || !sale) return null;

  function adjustQuantity(delta: number) {
    setForm((prev) => {
      const next = Math.max(1, (parseInt(prev.quantity) || 1) + delta);
      return { ...prev, quantity: String(next) };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!sale) return;
    setError("");

    const saleId = sale.id;

    const quantity = parseInt(form.quantity) || 1;
    const sliceCount = parseInt(form.slice_count) || 1;
    if (form.weight_type === "slice" && sliceCount < 1) {
      setError(t("common:weightTypes.sliceCount"));
      return;
    }

    const body: SaleUpdateRequest = {
      weight_type: form.weight_type,
      quantity,
      seller_id: parseInt(form.seller_id),
      payment_method: form.payment_method,
    };

    if (form.weight_type === "slice") {
      body.slice_count = sliceCount;
    }

    if (form.payment_method !== "cash") {
      const tip = parseFloat(form.tip_amount) || 0;
      if (tip > 0) body.tip_amount = tip;
      else body.tip_amount = 0;
    }

    await run(async () => {
      try {
        await api.patch<Sale>(`/sales/${saleId}`, body);
        onSaved();
        onClose();
      } catch (err) {
        setError(translateApiError(err));
      }
    });
  }

  const plateLabel = sale.dish?.name ?? t("common:sales.generalSale");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("common:actions.cancel")}
        onClick={onClose}
      />
      <div className="relative z-10 flex flex-col w-full max-h-[90vh] max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-theme-lg dark:bg-gray-900 sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("todaySales.editTitle")}
            </h2>
            <p className="text-sm text-gray-500 truncate dark:text-gray-400">{plateLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t("common:actions.cancel")}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 space-y-5">
            {error && (
              <p className="p-3 text-sm font-medium border rounded-xl text-error-700 bg-error-50 border-error-200 dark:bg-error-500/15 dark:border-error-700 dark:text-error-300">
                {error}
              </p>
            )}

            <div>
              <p className="mb-3 text-sm font-bold tracking-wide uppercase text-gray-600 dark:text-gray-400">
                {t("common:sales.weightPortion")}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {WEIGHT_OPTIONS.map((opt) => (
                  <ChoiceButton
                    key={opt}
                    selected={form.weight_type === opt}
                    onClick={() => setForm({ ...form, weight_type: opt })}
                    colorClass={portionColors[opt]}
                  >
                    {weightTypeLabel(opt)}
                  </ChoiceButton>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t("common:fields.quantity")}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => adjustQuantity(-1)}
                    className="flex items-center justify-center w-12 h-12 text-xl font-bold bg-white border-2 rounded-xl touch-target border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <Input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="text-center text-lg font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => adjustQuantity(1)}
                    className="flex items-center justify-center w-12 h-12 text-xl font-bold bg-white border-2 rounded-xl touch-target border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {form.weight_type === "slice" && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("common:weightTypes.sliceCount")}
                  </p>
                  <Input
                    type="number"
                    min="1"
                    value={form.slice_count}
                    onChange={(e) => setForm({ ...form, slice_count: e.target.value })}
                    className="text-lg font-semibold"
                  />
                </div>
              )}
            </div>

            <div>
              <Label>{t("common:fields.selectSeller")}</Label>
              <select
                value={form.seller_id}
                onChange={(e) => setForm({ ...form, seller_id: e.target.value })}
                className="field-select w-full"
                required
              >
                <option value="">{t("common:fields.selectSeller")}</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (#{s.short_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold tracking-wide uppercase text-gray-600 dark:text-gray-400">
                {t("common:paymentMethods.method")}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PAYMENT_OPTIONS.map((method) => (
                  <ChoiceButton
                    key={method}
                    selected={form.payment_method === method}
                    onClick={() => setForm({ ...form, payment_method: method })}
                    colorClass={paymentColors[method]}
                    className="text-xs sm:text-sm"
                  >
                    {paymentMethodLabel(method)}
                  </ChoiceButton>
                ))}
              </div>
            </div>

            {form.payment_method !== "cash" && (
              <div>
                <Label>{t("common:fields.tip")}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tip_amount}
                  onChange={(e) => setForm({ ...form, tip_amount: e.target.value })}
                  placeholder="0"
                />
              </div>
            )}

            <div className="p-4 text-center border rounded-xl bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("todaySales.currentTotal")}
              </p>
              <p className="text-xl font-bold text-brand-600 dark:text-brand-400">
                {formatCurrency(parseFloat(String(sale.total_price)))}
              </p>
              <p className="mt-1 text-xs text-gray-400">{t("todaySales.priceRecalcHint")}</p>
            </div>
          </div>

          <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              {t("common:actions.cancel")}
            </Button>
            <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={submitting}>
              {submitting ? t("todaySales.saving") : t("todaySales.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
