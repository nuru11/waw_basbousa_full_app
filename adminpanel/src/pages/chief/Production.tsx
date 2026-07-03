import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { DataTable, SectionCard, StatusBadge } from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Dish, type Ingredient, type ProductionLog } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";
import { kgToStoredGrams, plateWeightToKg } from "../../utils/plateWeight";
import {
  buildAdjustmentNote,
  ingredientDisplayName,
} from "../../utils/productionAdjustmentNote";
import { maxPlatesFromStock } from "../../utils/productionStock";
import {
  recipeUsageKey,
  resolveProductionRecipe,
} from "../../utils/resolveProductionRecipe";
import { translateApiError } from "../../utils/translateApiError";

const PLATES_COUNT = 1;

const emptyForm = {
  dish_id: "",
  plate_weight_kg: "",
  chiefNote: "",
};

function isAutoReduce(ingredient?: Ingredient): boolean {
  return ingredient?.auto_reduce !== false;
}

export default function ProductionPage() {
  const { t } = useTranslation(["chief", "common", "nav"]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [stock, setStock] = useState<Ingredient[]>([]);
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [ingredientUsage, setIngredientUsage] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const { submitting, run } = useSubmitLock();

  const producibleDishes = useMemo(
    () => dishes.filter((d) => d.recipe && d.recipe.length > 0),
    [dishes]
  );

  const selectedDish = useMemo(
    () => producibleDishes.find((d) => d.id === parseInt(form.dish_id)),
    [producibleDishes, form.dish_id]
  );

  const plateWeightKg = parseFloat(form.plate_weight_kg) || 0;

  const stockByIngredientId = useMemo(
    () =>
      new Map(
        stock.map((ingredient) => [
          ingredient.id,
          parseFloat(String(ingredient.current_stock)),
        ])
      ),
    [stock]
  );

  const hasSizeByIngredientId = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const ingredient of stock) {
      map.set(ingredient.id, ingredient.has_size);
    }
    for (const dish of dishes) {
      for (const item of dish.recipe ?? []) {
        if (item.ingredient?.has_size != null) {
          map.set(item.ingredient_id, item.ingredient.has_size);
        }
      }
    }
    return map;
  }, [stock, dishes]);

  const usageByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const [key, value] of Object.entries(ingredientUsage)) {
      const parsed = parseFloat(value);
      if (!Number.isNaN(parsed)) {
        map.set(key, parsed);
      }
    }
    return map;
  }, [ingredientUsage]);

  const autoRecipe = useMemo(() => {
    if (!selectedDish?.recipe) return [];
    return selectedDish.recipe.filter((item) => {
      const ingredient =
        stock.find((s) => s.id === item.ingredient_id) ?? item.ingredient;
      return isAutoReduce(ingredient);
    });
  }, [selectedDish, stock]);

  const effectiveAutoRecipe = useMemo(
    () =>
      resolveProductionRecipe(
        autoRecipe,
        stockByIngredientId,
        hasSizeByIngredientId,
        PLATES_COUNT,
        usageByKey
      ),
    [autoRecipe, stockByIngredientId, hasSizeByIngredientId, usageByKey]
  );

  const effectiveUsageKeySignature = useMemo(
    () =>
      effectiveAutoRecipe
        .map((item) => recipeUsageKey(item.ingredient_id, item.size))
        .sort()
        .join(","),
    [effectiveAutoRecipe]
  );

  useEffect(() => {
    if (!selectedDish) return;
    setForm((prev) => ({
      ...prev,
      plate_weight_kg: selectedDish.plate_weight_grams
        ? String(plateWeightToKg(selectedDish.plate_weight_grams))
        : "",
    }));
  }, [selectedDish?.id, selectedDish?.plate_weight_grams]);

  useEffect(() => {
    if (!selectedDish?.recipe) {
      setIngredientUsage({});
      return;
    }
    if (effectiveAutoRecipe.length === 0) return;

    setIngredientUsage((prev) => {
      const effectiveKeys = new Set(
        effectiveAutoRecipe.map((item) =>
          recipeUsageKey(item.ingredient_id, item.size)
        )
      );
      const prevKeys = Object.keys(prev);
      const keysMatch =
        prevKeys.length === effectiveKeys.size &&
        prevKeys.every((key) => effectiveKeys.has(key));
      if (keysMatch) return prev;

      const defaults: Record<string, string> = {};
      for (const item of effectiveAutoRecipe) {
        const key = recipeUsageKey(item.ingredient_id, item.size);
        const defaultQty =
          parseFloat(String(item.quantity_per_plate)) * PLATES_COUNT;
        defaults[key] = String(defaultQty);
      }
      return defaults;
    });
  }, [selectedDish?.id, effectiveUsageKeySignature, effectiveAutoRecipe]);

  const preview = useMemo(() => {
    if (!selectedDish?.recipe) return [];

    const effectiveKeys = new Set(
      effectiveAutoRecipe.map((item) =>
        recipeUsageKey(item.ingredient_id, item.size)
      )
    );

    return selectedDish.recipe
      .filter((item) => {
        const ingredient =
          stock.find((s) => s.id === item.ingredient_id) ?? item.ingredient;
        const manual = !isAutoReduce(ingredient);
        if (manual) return true;
        const key = recipeUsageKey(item.ingredient_id, item.size);
        return effectiveKeys.has(key);
      })
      .map((item) => {
      const key = recipeUsageKey(item.ingredient_id, item.size);
      const recipeDefault = parseFloat(String(item.quantity_per_plate)) * PLATES_COUNT;
      const used = parseFloat(ingredientUsage[key] ?? "");
      const ingredient = stock.find((s) => s.id === item.ingredient_id) ?? item.ingredient;
      const available = ingredient ? parseFloat(String(ingredient.current_stock)) : 0;
      const manual = !isAutoReduce(ingredient);
      const sizeLabel = item.size ? t(`common:fields.${item.size}`) : null;
      const baseName =
        ingredient?.name ??
        t("common:ingredientFallback", { id: item.ingredient_id });
      return {
        key,
        ingredientId: item.ingredient_id,
        size: item.size ?? null,
        name: baseName,
        displayName: ingredientDisplayName(baseName, item.size),
        sizeLabel,
        unit: ingredient?.unit ?? "",
        recipeDefault,
        used,
        available,
        isManual: manual,
        sufficient: manual || (used > 0 && available >= used),
      };
    });
  }, [selectedDish, stock, ingredientUsage, effectiveAutoRecipe, t]);

  const adjustmentNote = useMemo(
    () =>
      buildAdjustmentNote(
        preview
          .filter((row) => !row.isManual)
          .map((row) => ({
            delta: row.used - row.recipeDefault,
            name: row.displayName,
          }))
      ),
    [preview]
  );

  const autoPreview = useMemo(
    () => preview.filter((row) => !row.isManual),
    [preview]
  );

  const maxPlates = useMemo(() => {
    if (!autoRecipe.length) return 0;
    return maxPlatesFromStock(
      autoRecipe,
      stockByIngredientId,
      hasSizeByIngredientId,
      PLATES_COUNT
    );
  }, [autoRecipe, stockByIngredientId, hasSizeByIngredientId]);

  const canSubmit =
    form.dish_id &&
    plateWeightKg > 0 &&
    preview.length > 0 &&
    (autoPreview.length === 0 || autoPreview.every((p) => p.sufficient));

  const load = () => {
    api.get<Dish[]>("/dishes").then(setDishes);
    api.get<Ingredient[]>("/stock").then(setStock);
    api.get<ProductionLog[]>("/stock/production").then(setLogs);
  };

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const recipe = selectedDish?.recipe;
    if (!recipe) return;
    await run(async () => {
      setError("");
      try {
        const payload: {
          dish_id: number;
          plates_count: number;
          plate_weight_grams: number;
          notes: string | null;
          ingredient_usage?: {
            ingredient_id: number;
            size: string | null;
            quantity_used: number;
          }[];
        } = {
          dish_id: parseInt(form.dish_id),
          plates_count: PLATES_COUNT,
          plate_weight_grams: kgToStoredGrams(plateWeightKg),
          notes: form.chiefNote.trim() || null,
        };
        if (effectiveAutoRecipe.length > 0) {
          payload.ingredient_usage = effectiveAutoRecipe.map((item) => ({
            ingredient_id: item.ingredient_id,
            size: item.size ?? null,
            quantity_used: parseFloat(
              ingredientUsage[recipeUsageKey(item.ingredient_id, item.size)]
            ),
          }));
        }
        await api.post("/stock/production", payload);
        setForm(emptyForm);
        setIngredientUsage({});
        load();
      } catch (err: unknown) {
        setError(translateApiError(err));
      }
    });
  }

  return (
    <div>
      <PageMeta
        title={t("production.metaTitle")}
        description={t("production.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:cookPlates")} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={t("production.logCookedPlates")}>
          <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-error-500">{error}</p>}
          <div>
            <Label>{t("common:fields.plate")}</Label>
            <Select
              value={form.dish_id}
              onChange={(dish_id) =>
                setForm({
                  ...emptyForm,
                  dish_id,
                })
              }
              placeholder={t("common:fields.selectPlate")}
              options={producibleDishes.map((d) => ({
                value: String(d.id),
                label: d.name,
              }))}
            />
            {producibleDishes.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">{t("production.noRecipesHint")}</p>
            )}
          </div>
          <div>
            <Label>{t("production.plateWeightKg")}</Label>
            <Input
              type="number"
              min="0.001"
              step={0.001}
              value={form.plate_weight_kg}
              onChange={(e) => setForm({ ...form, plate_weight_kg: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500">{t("production.plateWeightHint")}</p>
          </div>
          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("production.ingredientsUsed")}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("production.maxPlatesFromStock", { count: formatNumber(maxPlates) })}
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                    <th className="p-2">{t("common:fields.ingredient")}</th>
                    <th className="p-2">{t("production.quantityUsed")}</th>
                    <th className="p-2">{t("common:fields.inStock")}</th>
                    <th className="p-2">{t("common:fields.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="p-2">
                        {row.name}
                        {row.sizeLabel && (
                          <span className="ms-1 text-xs text-gray-500">({row.sizeLabel})</span>
                        )}
                        {row.isManual && (
                          <span className="mt-1 block">
                            <StatusBadge variant="info">{t("production.manualReduceOnly")}</StatusBadge>
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        {row.isManual ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("production.recipeDefault", {
                              amount: formatNumber(row.recipeDefault),
                              unit: row.unit,
                            })}
                          </p>
                        ) : (
                          <>
                            <Input
                              type="number"
                              min="0.001"
                              step={0.001}
                              value={ingredientUsage[row.key] ?? ""}
                              onChange={(e) =>
                                setIngredientUsage((prev) => ({
                                  ...prev,
                                  [row.key]: e.target.value,
                                }))
                              }
                              className="max-w-28"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              {t("production.recipeDefault", {
                                amount: formatNumber(row.recipeDefault),
                                unit: row.unit,
                              })}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="p-2">
                        {formatNumber(row.available)} {row.unit}
                      </td>
                      <td className="p-2">
                        {row.isManual ? (
                          <StatusBadge variant="info">{t("production.manualReduceOnly")}</StatusBadge>
                        ) : (
                          <StatusBadge variant={row.sufficient ? "active" : "low_stock"}>
                            {row.sufficient
                              ? t("common:status.ok")
                              : t("common:status.insufficient")}
                          </StatusBadge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
          <div>
            <Label>{t("production.adjustmentNote")}</Label>
            <Input
              value={adjustmentNote}
              disabled
              placeholder={t("production.noAdjustments")}
            />
            <p className="mt-1 text-xs text-gray-500">{t("production.adjustmentHint")}</p>
          </div>
          <div>
            <Label>{t("production.optionalNote")}</Label>
            <Input
              value={form.chiefNote}
              onChange={(e) => setForm({ ...form, chiefNote: e.target.value })}
            />
          </div>
          <Button type="submit" size="sm" disabled={submitting || !canSubmit}>
            {submitting ? t("common:actions.logging") : t("production.logProductionBtn")}
          </Button>
          </form>
        </SectionCard>
        <SectionCard title={t("production.recentProduction")}>
          <DataTable
            columns={[
              {
                key: "plate",
                header: t("common:fields.plate"),
                render: (log) => log.dish?.name ?? t("common:emDash"),
              },
              {
                key: "date",
                header: t("common:fields.date"),
                render: (log) => new Date(log.logged_at).toLocaleString(),
              },
              {
                key: "notes",
                header: t("common:fields.notes"),
                render: (log) => log.notes || t("common:emDash"),
              },
            ] satisfies DataTableColumn<ProductionLog>[]}
            data={logs}
            keyExtractor={(log) => log.id}
            hoverRows
          />
        </SectionCard>
      </div>
    </div>
  );
}
