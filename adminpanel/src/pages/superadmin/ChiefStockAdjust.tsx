import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import IngredientStockGrid from "../../components/inventory/IngredientStockGrid";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { SectionCard } from "../../components/ui";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Ingredient } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";
import { translateApiError } from "../../utils/translateApiError";

const EMPTY_FORM = { ingredient_id: "", quantity_delta: "", notes: "" };

export default function ChiefStockAdjustPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tChief } = useTranslation("chief");
  const { t: tNav } = useTranslation("nav");
  const [stock, setStock] = useState<Ingredient[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { submitting, run } = useSubmitLock();

  const load = () =>
    api
      .get<Ingredient[]>("/stock")
      .then(setStock)
      .catch((e) => setError(translateApiError(e)));

  useEffect(() => {
    load();
  }, []);

  const selectedIngredient = useMemo(
    () => stock.find((item) => item.id === Number(form.ingredient_id)),
    [stock, form.ingredient_id]
  );

  const delta = parseFloat(form.quantity_delta);
  const hasDelta = form.quantity_delta !== "" && !Number.isNaN(delta) && delta !== 0;
  const currentStock = selectedIngredient
    ? parseFloat(String(selectedIngredient.current_stock))
    : null;
  const newStock =
    currentStock !== null && hasDelta ? currentStock + delta : null;
  const belowZero = newStock !== null && newStock < 0;
  const canSubmit =
    selectedIngredient && hasDelta && !belowZero && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedIngredient) return;

    setError("");
    setSuccess("");
    await run(async () => {
      try {
        await api.post("/stock/adjust", {
          ingredient_id: selectedIngredient.id,
          quantity_delta: delta,
          notes: form.notes.trim() || undefined,
        });
        setForm(EMPTY_FORM);
        setSuccess(t("chiefStockAdjust.adjustedSuccess"));
        await load();
      } catch (err: unknown) {
        setError(translateApiError(err, "common:failed"));
      }
    });
  }

  const ingredientOptions = useMemo(
    () =>
      stock.map((item) => ({
        value: String(item.id),
        label: `${item.name} (${formatNumber(item.current_stock)} ${item.unit})`,
      })),
    [stock]
  );

  return (
    <div>
      <PageMeta
        title={t("chiefStockAdjust.metaTitle")}
        description={t("chiefStockAdjust.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("chiefStockAdjust")} />
      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {success && (
        <p className="mb-4 text-sm text-success-600 dark:text-success-400">
          {success}
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title={t("chiefStockAdjust.adjustTitle")}>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {t("chiefStockAdjust.adjustHint")}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{tCommon("fields.ingredient")}</Label>
              <Select
                value={form.ingredient_id}
                onChange={(ingredient_id) =>
                  setForm((prev) => ({ ...prev, ingredient_id }))
                }
                options={ingredientOptions}
                placeholder={t("chiefStockAdjust.selectIngredient")}
              />
            </div>
            <div>
              <Label>{t("chiefStockAdjust.quantityDelta")}</Label>
              <Input
                type="number"
                step={0.01}
                value={form.quantity_delta}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, quantity_delta: e.target.value }))
                }
                placeholder={t("chiefStockAdjust.quantityDeltaPlaceholder")}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("chiefStockAdjust.quantityDeltaHint")}
              </p>
            </div>
            {selectedIngredient && hasDelta && (
              <div
                className={
                  belowZero
                    ? "rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
                    : "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }
              >
                <p>
                  {t("chiefStockAdjust.currentStock")}:{" "}
                  <span className="font-medium">
                    {formatNumber(selectedIngredient.current_stock)}{" "}
                    {selectedIngredient.unit}
                  </span>
                </p>
                <p>
                  {t("chiefStockAdjust.newStock")}:{" "}
                  <span className="font-medium">
                    {newStock !== null
                      ? `${formatNumber(newStock)} ${selectedIngredient.unit}`
                      : tCommon("emDash")}
                  </span>
                </p>
                {belowZero && (
                  <p className="mt-1">{t("chiefStockAdjust.belowZero")}</p>
                )}
              </div>
            )}
            <div>
              <Label>{tCommon("fields.notes")}</Label>
              <TextArea
                rows={3}
                value={form.notes}
                onChange={(notes) => setForm((prev) => ({ ...prev, notes }))}
                placeholder={t("chiefStockAdjust.notesPlaceholder")}
              />
            </div>
            <Button type="submit" size="sm" disabled={!canSubmit}>
              {submitting
                ? t("chiefStockAdjust.adjusting")
                : t("chiefStockAdjust.adjustButton")}
            </Button>
          </form>
        </SectionCard>
        <SectionCard
          title={t("productionHistory.chiefInventory")}
          className="lg:col-span-2"
        >
          <IngredientStockGrid
            ingredients={stock}
            highlightId={
              form.ingredient_id ? Number(form.ingredient_id) : undefined
            }
            lowStockAlert={tChief("inventory.lowStockAlert")}
          />
        </SectionCard>
      </div>
    </div>
  );
}
