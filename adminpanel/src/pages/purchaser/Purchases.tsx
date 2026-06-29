import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import IngredientStockGrid, {
  isLowStock,
} from "../../components/inventory/IngredientStockGrid";
import { SectionCard, StatCard, StatusBadge } from "../../components/ui";
import { api, type Ingredient, type TransferBalance } from "../../services/api";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { translateApiError } from "../../utils/translateApiError";

export default function PurchasesPage() {
  const { t } = useTranslation(["purchaser", "common", "nav", "validation"]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [balance, setBalance] = useState<TransferBalance | null>(null);
  const [form, setForm] = useState({
    ingredient_id: "",
    quantity: "",
    unit_price: "",
    size: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { submitting, run } = useSubmitLock();

  const load = () => {
    api.get<Ingredient[]>("/ingredients").then(setIngredients);
    api.get<TransferBalance>("/transfers/balance").then(setBalance);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!screenshot) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(screenshot);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshot]);

  const total =
    form.quantity && form.unit_price
      ? parseFloat(form.quantity) * parseFloat(form.unit_price)
      : 0;

  const selectedIngredient = useMemo(
    () => ingredients.find((i) => String(i.id) === form.ingredient_id),
    [ingredients, form.ingredient_id]
  );

  const requiresSize = selectedIngredient?.has_size ?? false;

  const selectedLow = selectedIngredient ? isLowStock(selectedIngredient) : false;

  const ingredientOptions = useMemo(
    () =>
      ingredients.map((i) => {
        const low = isLowStock(i);
        return {
          value: String(i.id),
          label: low
            ? t("purchases.ingredientOptionLow", {
                name: i.name,
                unit: i.unit,
              })
            : t("purchases.ingredientOptionRemaining", {
                name: i.name,
                unit: i.unit,
                amount: formatNumber(i.current_stock),
              }),
        };
      }),
    [ingredients, t]
  );

  function handleIngredientChange(ingredient_id: string) {
    setForm({ ...form, ingredient_id, size: "" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      setError("");
      setSuccess("");
      setWarning("");

      if (balance && total > balance.total_remaining) {
        setWarning(
          t("purchases.balanceExceededWarning", {
            amount: formatCurrency(balance.total_remaining),
          })
        );
      }

      if (!screenshot) {
        setError(t("validation:required.screenshot"));
        return;
      }

      if (requiresSize && !form.size) {
        setError(t("purchases.sizeRequired"));
        return;
      }

      try {
        const formData = new FormData();
        formData.append("ingredient_id", form.ingredient_id);
        formData.append("quantity", form.quantity);
        formData.append("unit_price", form.unit_price);
        if (requiresSize) {
          formData.append("size", form.size);
        }
        formData.append("screenshot", screenshot);

        await api.postForm("/purchases", formData);
        setSuccess(t("purchases.submittedSuccess"));
        setForm({ ingredient_id: "", quantity: "", unit_price: "", size: "" });
        setScreenshot(null);
        load();
      } catch (err: unknown) {
        setError(translateApiError(err));
      }
    });
  }

  return (
    <div>
      <PageMeta
        title={t("purchases.metaTitle")}
        description={t("purchases.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:purchases")} />

      {balance && (balance.total_received > 0 || balance.total_pending > 0) && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {balance.total_pending > 0 && (
            <StatCard
              title={t("common:transfers.pendingAcceptance")}
              value={formatCurrency(balance.total_pending)}
              accent="warning"
            />
          )}
          {/* <StatCard
            title={t("common:transfers.totalReceived")}
            value={formatCurrency(balance.total_received)}
            accent="brand"
          /> */}
          <StatCard
            title={t("common:transfers.remaining")}
            value={formatCurrency(balance.total_remaining)}
            accent={balance.total_remaining < 0 ? "error" : "success"}
          />
        </div>
      )}

      {ingredients.length > 0 && (
        <SectionCard title={t("purchases.kitchenStockTitle")} className="mb-6">
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {t("purchases.kitchenStockHint")}
          </p>
          <IngredientStockGrid
            ingredients={ingredients}
            highlightId={selectedIngredient?.id}
            lowStockAlert={t("purchases.selectedStockLow")}
          />
        </SectionCard>
      )}

      <SectionCard title={t("purchases.newPurchaseInvoice")} className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error-500">{error}</p>}
        {warning && <p className="text-sm text-warning-500">{warning}</p>}
        {success && <p className="text-sm text-success-500">{success}</p>}
        <div>
          <Label>{t("common:fields.ingredient")}</Label>
          <Select
            value={form.ingredient_id}
            onChange={handleIngredientChange}
            placeholder={t("common:fields.selectIngredient")}
            options={ingredientOptions}
          />
          {selectedIngredient && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>
                {t("purchases.selectedStockCurrent", {
                  amount: formatNumber(selectedIngredient.current_stock),
                  unit: selectedIngredient.unit,
                })}
              </span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>
                {t("purchases.selectedStockMin", {
                  amount: formatNumber(selectedIngredient.min_stock),
                  unit: selectedIngredient.unit,
                })}
              </span>
              {selectedLow && (
                <StatusBadge variant="low_stock">
                  {t("purchases.selectedStockLow")}
                </StatusBadge>
              )}
            </div>
          )}
        </div>
        {requiresSize && (
          <div>
            <Label>{t("purchases.sizeLabel")}</Label>
            <Select
              value={form.size}
              onChange={(size) => setForm({ ...form, size })}
              placeholder={t("purchases.sizeLabel")}
              options={[
                { value: "small", label: t("purchases.sizeSmall") },
                { value: "large", label: t("purchases.sizeLarge") },
              ]}
            />
          </div>
        )}
        <div>
          <Label>{t("common:fields.quantity")}</Label>
          <Input
            type="number"
            step={0.001}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
        </div>
        <div>
          <Label>{t("purchases.unitPriceEtb")}</Label>
          <Input
            type="number"
            step={0.01}
            value={form.unit_price}
            onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
          />
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {t("purchases.totalLabel", { amount: total.toFixed(2) })}
        </p>
        <div>
          <Label>{t("purchases.screenshotLabel")}</Label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="block w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 dark:file:bg-gray-800 dark:file:text-gray-300"
            onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt={t("common:screenshotPreviewAlt")}
              className="mt-2 max-h-32 rounded-lg border border-gray-200 dark:border-gray-700"
            />
          )}
        </div>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? t("common:actions.submitting") : t("common:actions.submit")}
        </Button>
        <p className="text-sm">
          <Link
            to="/purchaser/purchases/history"
            className="text-brand-500 hover:underline"
          >
            {t("purchases.viewHistoryLink")}
          </Link>
        </p>
        </form>
      </SectionCard>
    </div>
  );
}
