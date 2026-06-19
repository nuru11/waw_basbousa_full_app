import { useEffect, useMemo, useState, type FormEvent } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Dish, type Ingredient, type ProductionLog } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";
import { kgToStoredGrams, plateWeightToKg } from "../../utils/plateWeight";

const PLATES_COUNT = 1;

const emptyForm = {
  dish_id: "",
  plate_weight_kg: "",
  notes: "",
};

export default function ProductionPage() {
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
        name: ingredient?.name ?? `Ingredient #${item.ingredient_id}`,
        unit: ingredient?.unit ?? "",
        needed,
        available,
        sufficient: available >= needed,
      };
    });
  }, [selectedDish, stock]);

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
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div>
      <PageMeta title="Production | Restaurant" description="Log cooked plates" />
      <PageBreadcrumb pageTitle="Cook Plates" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 rounded-2xl border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold">Log Cooked Plates</h3>
          {error && <p className="text-sm text-error-500">{error}</p>}
          <div>
            <Label>Plate</Label>
            <select
              className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
              value={form.dish_id}
              onChange={(e) =>
                setForm({
                  ...emptyForm,
                  dish_id: e.target.value,
                  notes: form.notes,
                })
              }
            >
              <option value="">Select plate</option>
              {producibleDishes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {producibleDishes.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                No plates with recipes defined. Ask superadmin to set up recipes.
              </p>
            )}
          </div>
          <div>
            <Label>Plate Weight (kg)</Label>
            <Input
              type="number"
              min="0.01"
              step={0.01}
              value={form.plate_weight_kg}
              onChange={(e) => setForm({ ...form, plate_weight_kg: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500">
              Weight of one cooked plate in kilograms (e.g. 1, 5, 28)
            </p>
          </div>
          {preview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                    <th className="p-2">Ingredient</th>
                    <th className="p-2">Needed</th>
                    <th className="p-2">In Stock</th>
                    <th className="p-2">Status</th>
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
                        <span className={row.sufficient ? "text-success-500" : "text-error-500"}>
                          {row.sufficient ? "OK" : "Insufficient"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div>
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <Button type="submit" size="sm" disabled={submitting || !canSubmit}>
            {submitting ? "Logging..." : "Log Production (deducts stock)"}
          </Button>
        </form>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
          <h3 className="mb-4 font-semibold">Recent Production</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-2">Plate</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2">{log.dish?.name}</td>
                  <td className="py-2">{new Date(log.logged_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
