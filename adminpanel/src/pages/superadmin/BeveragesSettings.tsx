import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import { SectionCard } from "../../components/ui";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type CoffeeSettings, type Ingredient, type WaterSettings } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";
import { translateApiError } from "../../utils/translateApiError";

export default function BeveragesSettingsPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [kgIngredients, setKgIngredients] = useState<Ingredient[]>([]);
  const [coffeeSettings, setCoffeeSettings] = useState<CoffeeSettings | null>(null);
  const [waterSettings, setWaterSettings] = useState<WaterSettings | null>(null);
  const [coffeeForm, setCoffeeForm] = useState({
    ingredient_id: "",
    price_per_cup: "",
    cups_per_kg: "100",
    is_active: false,
  });
  const [waterForm, setWaterForm] = useState({
    price_per_bottle: "",
    price_large_bottle: "",
    min_stock_bottles: "",
    is_active: false,
  });
  const [stockAdjustForm, setStockAdjustForm] = useState({
    quantity_delta: "",
    notes: "",
    bottle_size: "small",
  });
  const [error, setError] = useState("");
  const [coffeeSuccess, setCoffeeSuccess] = useState("");
  const [waterSuccess, setWaterSuccess] = useState("");
  const [stockAdjustSuccess, setStockAdjustSuccess] = useState("");
  const { submitting, run } = useSubmitLock();

  const load = async () => {
    try {
      const [ingredientList, coffee, water] = await Promise.all([
        api.get<Ingredient[]>("/ingredients"),
        api.get<CoffeeSettings>("/coffee/settings"),
        api.get<WaterSettings>("/water/settings"),
      ]);
      setKgIngredients(ingredientList.filter((i) => i.unit === "kg"));
      setCoffeeSettings(coffee);
      setWaterSettings(water);
      setCoffeeForm({
        ingredient_id: coffee.ingredient_id ? String(coffee.ingredient_id) : "",
        price_per_cup: coffee.price_per_cup != null ? String(coffee.price_per_cup) : "",
        cups_per_kg: String(coffee.cups_per_kg ?? 100),
        is_active: coffee.is_active,
      });
      setWaterForm({
        price_per_bottle:
          water.price_per_bottle != null ? String(water.price_per_bottle) : "",
        price_large_bottle:
          water.price_large_bottle != null ? String(water.price_large_bottle) : "",
        min_stock_bottles:
          water.min_stock_bottles != null ? String(water.min_stock_bottles) : "0",
        is_active: water.is_active,
      });
    } catch (e) {
      setError(translateApiError(e));
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function handleCoffeeSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      try {
        setError("");
        setCoffeeSuccess("");
        const updated = await api.put<CoffeeSettings>("/coffee/settings", {
          ingredient_id: coffeeForm.ingredient_id
            ? parseInt(coffeeForm.ingredient_id, 10)
            : null,
          price_per_cup: coffeeForm.price_per_cup ? parseFloat(coffeeForm.price_per_cup) : null,
          cups_per_kg: parseFloat(coffeeForm.cups_per_kg) || 100,
          is_active: coffeeForm.is_active,
        });
        setCoffeeSettings(updated);
        setCoffeeSuccess(t("coffee.saved"));
      } catch (err: unknown) {
        setError(translateApiError(err, "common:failed"));
      }
    });
  }

  async function handleWaterSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      try {
        setError("");
        setWaterSuccess("");
        const updated = await api.put<WaterSettings>("/water/settings", {
          price_per_bottle: waterForm.price_per_bottle
            ? parseFloat(waterForm.price_per_bottle)
            : null,
          price_large_bottle: waterForm.price_large_bottle
            ? parseFloat(waterForm.price_large_bottle)
            : null,
          min_stock_bottles: parseFloat(waterForm.min_stock_bottles) || 0,
          is_active: waterForm.is_active,
        });
        setWaterSettings(updated);
        setWaterSuccess(t("water.saved"));
      } catch (err: unknown) {
        setError(translateApiError(err, "common:failed"));
      }
    });
  }

  async function handleStockAdjust(e: FormEvent) {
    e.preventDefault();
    const delta = parseFloat(stockAdjustForm.quantity_delta);
    if (!delta || Number.isNaN(delta)) return;

    await run(async () => {
      try {
        setError("");
        setStockAdjustSuccess("");
        const updated = await api.post<WaterSettings>("/water/stock/adjust", {
          bottle_size: stockAdjustForm.bottle_size,
          quantity_delta: delta,
          ...(stockAdjustForm.notes.trim() ? { notes: stockAdjustForm.notes.trim() } : {}),
        });
        setWaterSettings(updated);
        setStockAdjustForm({ quantity_delta: "", notes: "", bottle_size: stockAdjustForm.bottle_size });
        setStockAdjustSuccess(t("water.stockAdjusted"));
      } catch (err: unknown) {
        setError(translateApiError(err, "common:failed"));
      }
    });
  }

  const coffeeIngredientOptions = [
    { value: "", label: t("coffee.selectIngredient") },
    ...kgIngredients.map((i) => ({
      value: String(i.id),
      label: `${i.name} (${formatNumber(i.current_stock)} ${tCommon(`units.${i.unit}`)})`,
    })),
  ];

  return (
    <>
      <PageMeta title={t("beverages.metaTitle")} description={t("beverages.metaDescription")} />
      <PageBreadcrumb pageTitle={tNav("beverages")} />

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <SectionCard title={t("coffee.title")}>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t("coffee.description")}</p>

          {coffeeSuccess && (
            <div className="mb-4 rounded-lg bg-success-50 p-3 text-sm text-success-600 dark:bg-success-500/10">
              {coffeeSuccess}
            </div>
          )}

          {coffeeSettings && (
            <div className="mb-6 grid gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">{t("coffee.stockKg")}</p>
                <p className="text-lg font-semibold">
                  {formatNumber(coffeeSettings.current_stock_kg)} {tCommon("units.kg")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  {t("coffee.availableCups")}
                </p>
                <p className="text-lg font-semibold">
                  {formatNumber(coffeeSettings.available_cups)}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleCoffeeSubmit} className="max-w-lg space-y-4">
            <div>
              <Label>{t("coffee.linkedIngredient")}</Label>
              <Select
                value={coffeeForm.ingredient_id}
                onChange={(v) => setCoffeeForm({ ...coffeeForm, ingredient_id: v })}
                options={coffeeIngredientOptions}
              />
              <p className="mt-1 text-xs text-gray-500">{t("coffee.ingredientHint")}</p>
            </div>

            <div>
              <Label>{t("coffee.pricePerCup")}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={coffeeForm.price_per_cup}
                onChange={(e) => setCoffeeForm({ ...coffeeForm, price_per_cup: e.target.value })}
              />
            </div>

            <div>
              <Label>{t("coffee.cupsPerKg")}</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={coffeeForm.cups_per_kg}
                onChange={(e) => setCoffeeForm({ ...coffeeForm, cups_per_kg: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">{t("coffee.cupsPerKgHint")}</p>
            </div>

            <Checkbox
              label={t("coffee.activeInPos")}
              checked={coffeeForm.is_active}
              onChange={(is_active) => setCoffeeForm({ ...coffeeForm, is_active })}
            />

            <Button type="submit" disabled={submitting}>
              {submitting ? t("coffee.saving") : t("coffee.saveSettings")}
            </Button>
          </form>
        </SectionCard>

        <SectionCard title={t("water.title")}>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{t("water.description")}</p>

          {waterSuccess && (
            <div className="mb-4 rounded-lg bg-success-50 p-3 text-sm text-success-600 dark:bg-success-500/10">
              {waterSuccess}
            </div>
          )}

          {stockAdjustSuccess && (
            <div className="mb-4 rounded-lg bg-success-50 p-3 text-sm text-success-600 dark:bg-success-500/10">
              {stockAdjustSuccess}
            </div>
          )}

          {waterSettings && (
            <div className="mb-6 grid gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">{t("water.stockSmallBottles")}</p>
                <p className="text-lg font-semibold">
                  {formatNumber(waterSettings.available_small_bottles)} {t("water.bottleUnit")}
                </p>
                {waterSettings.low_stock_small && (
                  <p className="mt-1 text-xs text-warning-600">{t("water.lowStock")}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">{t("water.stockLargeBottles")}</p>
                <p className="text-lg font-semibold">
                  {formatNumber(waterSettings.available_large_bottles)} {t("water.bottleUnit")}
                </p>
                {waterSettings.low_stock_large && (
                  <p className="mt-1 text-xs text-warning-600">{t("water.lowStock")}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase text-gray-500">{t("water.minStockBottles")}</p>
                <p className="text-lg font-semibold">
                  {formatNumber(waterSettings.min_stock_bottles)} {t("water.bottleUnit")}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleWaterSubmit} className="mb-8 max-w-lg space-y-4">
            <div>
              <Label>{t("water.priceSmallBottle")}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={waterForm.price_per_bottle}
                onChange={(e) => setWaterForm({ ...waterForm, price_per_bottle: e.target.value })}
              />
            </div>

            <div>
              <Label>{t("water.priceLargeBottle")}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={waterForm.price_large_bottle}
                onChange={(e) => setWaterForm({ ...waterForm, price_large_bottle: e.target.value })}
              />
            </div>

            <div>
              <Label>{t("water.minStockBottles")}</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={waterForm.min_stock_bottles}
                onChange={(e) => setWaterForm({ ...waterForm, min_stock_bottles: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">{t("water.minStockHint")}</p>
            </div>

            <Checkbox
              label={t("water.activeInPos")}
              checked={waterForm.is_active}
              onChange={(is_active) => setWaterForm({ ...waterForm, is_active })}
            />

            <Button type="submit" disabled={submitting}>
              {submitting ? t("water.saving") : t("water.saveSettings")}
            </Button>
          </form>

          <form onSubmit={handleStockAdjust} className="max-w-lg space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {t("water.adjustStock")}
            </h3>
            <p className="text-xs text-gray-500">{t("water.adjustHint")}</p>

            <div>
              <Label>{t("water.adjustBottleSize")}</Label>
              <Select
                value={stockAdjustForm.bottle_size}
                onChange={(v) => setStockAdjustForm({ ...stockAdjustForm, bottle_size: v })}
                options={[
                  { value: "small", label: t("water.priceSmallBottle") },
                  { value: "large", label: t("water.priceLargeBottle") },
                ]}
              />
            </div>

            <div>
              <Label>{t("water.quantityDelta")}</Label>
              <Input
                type="number"
                step="1"
                value={stockAdjustForm.quantity_delta}
                onChange={(e) =>
                  setStockAdjustForm({ ...stockAdjustForm, quantity_delta: e.target.value })
                }
                placeholder="20 or -5"
              />
            </div>

            <div>
              <Label>{tCommon("fields.notes")}</Label>
              <Input
                type="text"
                value={stockAdjustForm.notes}
                onChange={(e) => setStockAdjustForm({ ...stockAdjustForm, notes: e.target.value })}
              />
            </div>

            <Button type="submit" disabled={submitting || !stockAdjustForm.quantity_delta}>
              {submitting ? t("water.adjusting") : t("water.applyAdjust")}
            </Button>
          </form>
        </SectionCard>
      </div>
    </>
  );
}
