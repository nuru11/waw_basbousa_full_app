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
import { translateApiError } from "../../utils/translateApiError";

const PLATES_COUNT = 1;

const emptyForm = {
  dish_id: "",
  plate_weight_kg: "",
  notes: "",
};

export default function ProductionPage() {
  const { t } = useTranslation(["chief", "common", "nav"]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [stock, setStock] = useState<Ingredient[]>([]);
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [form, setForm] = useState(emptyForm);
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

  useEffect(() => {
    if (!selectedDish) return;
    setForm((prev) => ({
      ...prev,
      plate_weight_kg: selectedDish.plate_weight_grams
        ? String(plateWeightToKg(selectedDish.plate_weight_grams))
        : "",
    }));
  }, [selectedDish?.id, selectedDish?.plate_weight_grams]);

  const preview = useMemo(() => {
    if (!selectedDish?.recipe) return [];
    return selectedDish.recipe.map((item) => {
      const needed = parseFloat(String(item.quantity_per_plate)) * PLATES_COUNT;
      const ingredient = stock.find((s) => s.id === item.ingredient_id) ?? item.ingredient;
      const available = ingredient ? parseFloat(String(ingredient.current_stock)) : 0;
      return {
        name:
          ingredient?.name ??
          t("common:ingredientFallback", { id: item.ingredient_id }),
        unit: ingredient?.unit ?? "",
        needed,
        available,
        sufficient: available >= needed,
      };
    });
  }, [selectedDish, stock, t]);

  const canSubmit =
    form.dish_id &&
    plateWeightKg > 0 &&
    preview.length > 0 &&
    preview.every((p) => p.sufficient);

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
    await run(async () => {
      setError("");
      try {
        await api.post("/stock/production", {
          dish_id: parseInt(form.dish_id),
          plates_count: PLATES_COUNT,
          plate_weight_grams: kgToStoredGrams(plateWeightKg),
          notes: form.notes || null,
        });
        setForm(emptyForm);
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
                  notes: form.notes,
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
              min="0.01"
              step={0.01}
              value={form.plate_weight_kg}
              onChange={(e) => setForm({ ...form, plate_weight_kg: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500">{t("production.plateWeightHint")}</p>
          </div>
          {preview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                    <th className="p-2">{t("common:fields.ingredient")}</th>
                    <th className="p-2">{t("common:fields.needed")}</th>
                    <th className="p-2">{t("common:fields.inStock")}</th>
                    <th className="p-2">{t("common:fields.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.name} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-2">{row.name}</td>
                      <td className="p-2">
                        {formatNumber(row.needed)} {row.unit}
                      </td>
                      <td className="p-2">
                        {formatNumber(row.available)} {row.unit}
                      </td>
                      <td className="p-2">
                        <StatusBadge variant={row.sufficient ? "active" : "low_stock"}>
                          {row.sufficient
                            ? t("common:status.ok")
                            : t("common:status.insufficient")}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div>
            <Label>{t("common:fields.notes")}</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
