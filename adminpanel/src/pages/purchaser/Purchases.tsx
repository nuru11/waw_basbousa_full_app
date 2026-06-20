import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { SectionCard, StatCard } from "../../components/ui";
import { api, type Ingredient, type TransferBalance } from "../../services/api";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { formatCurrency } from "../../utils/formatCurrency";
import { translateApiError } from "../../utils/translateApiError";

export default function PurchasesPage() {
  const { t } = useTranslation(["purchaser", "common", "nav", "validation"]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [balance, setBalance] = useState<TransferBalance | null>(null);
  const [form, setForm] = useState({
    ingredient_id: "",
    quantity: "",
    unit_price: "",
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

      try {
        const formData = new FormData();
        formData.append("ingredient_id", form.ingredient_id);
        formData.append("quantity", form.quantity);
        formData.append("unit_price", form.unit_price);
        formData.append("screenshot", screenshot);

        await api.postForm("/purchases", formData);
        setSuccess(t("purchases.submittedSuccess"));
        setForm({ ingredient_id: "", quantity: "", unit_price: "" });
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

      <SectionCard title={t("purchases.newPurchaseInvoice")} className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error-500">{error}</p>}
        {warning && <p className="text-sm text-warning-500">{warning}</p>}
        {success && <p className="text-sm text-success-500">{success}</p>}
        <div>
          <Label>{t("common:fields.ingredient")}</Label>
          <Select
            value={form.ingredient_id}
            onChange={(ingredient_id) => setForm({ ...form, ingredient_id })}
            placeholder={t("common:fields.selectIngredient")}
            options={ingredients.map((i) => ({
              value: String(i.id),
              label: `${i.name} (${i.unit})`,
            }))}
          />
        </div>
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
