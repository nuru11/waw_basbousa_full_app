import { useEffect, useState, type FormEvent } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import RecipeEditor, {
  parseRecipeRows,
  recipeRowsFromDish,
  type RecipeRow,
} from "../../components/dishes/RecipeEditor";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Dish, type Ingredient } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";
import { plateWeightToKg } from "../../utils/plateWeight";

const emptyForm = {
  name: "",
  price_quarter: "",
  price_half: "",
  price_kilo: "",
  price_per_slice: "",
};

function recipeSummary(dish: Dish) {
  const count = dish.recipe?.length ?? 0;
  if (count === 0) return "No recipe";
  const names = dish.recipe!
    .map((r) => r.ingredient?.name ?? `#${r.ingredient_id}`)
    .slice(0, 2)
    .join(", ");
  return count > 2 ? `${names} +${count - 2} more` : names;
}

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [createRecipeRows, setCreateRecipeRows] = useState<RecipeRow[]>([
    { ingredient_id: "", quantity_per_plate: "" },
  ]);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [editRecipeRows, setEditRecipeRows] = useState<RecipeRow[]>([]);
  const [error, setError] = useState("");
  const { submitting, run } = useSubmitLock();

  const load = () =>
    api
      .get<Dish[]>("/dishes")
      .then(setDishes)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
    api.get<Ingredient[]>("/ingredients").then(setIngredients).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      try {
        const recipe = parseRecipeRows(createRecipeRows);
        await api.post("/dishes", {
          name: form.name,
          price_quarter: form.price_quarter ? parseFloat(form.price_quarter) : null,
          price_half: form.price_half ? parseFloat(form.price_half) : null,
          price_kilo: form.price_kilo ? parseFloat(form.price_kilo) : null,
          price_per_slice: form.price_per_slice ? parseFloat(form.price_per_slice) : null,
          ...(recipe.length > 0 ? { recipe } : {}),
        });
        setForm(emptyForm);
        setCreateRecipeRows([{ ingredient_id: "", quantity_per_plate: "" }]);
        load();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  async function toggleActive(dish: Dish) {
    await api.put(`/dishes/${dish.id}`, { is_active: !dish.is_active });
    load();
  }

  function openRecipeEditor(dish: Dish) {
    setEditingDish(dish);
    setEditRecipeRows(recipeRowsFromDish(dish.recipe));
  }

  function closeRecipeEditor() {
    setEditingDish(null);
  }

  async function handleSaveRecipe(e: FormEvent) {
    e.preventDefault();
    if (!editingDish) return;
    await run(async () => {
      try {
        await api.put(`/dishes/${editingDish.id}/recipe`, {
          recipe: parseRecipeRows(editRecipeRows),
        });
        closeRecipeEditor();
        load();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to save recipe");
      }
    });
  }

  return (
    <div>
      <PageMeta title="Plates / Menu | Restaurant" description="Manage plates and recipes" />
      <PageBreadcrumb pageTitle="Plates / Menu" />
      {error && <p className="mb-4 text-error-500">{error}</p>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-3 rounded-2xl border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold">Add Plate</h3>
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Price Quarter</Label>
            <Input
              type="number"
              value={form.price_quarter}
              onChange={(e) => setForm({ ...form, price_quarter: e.target.value })}
            />
          </div>
          <div>
            <Label>Price Half</Label>
            <Input
              type="number"
              value={form.price_half}
              onChange={(e) => setForm({ ...form, price_half: e.target.value })}
            />
          </div>
          <div>
            <Label>Price Kilo</Label>
            <Input
              type="number"
              value={form.price_kilo}
              onChange={(e) => setForm({ ...form, price_kilo: e.target.value })}
            />
          </div>
          <div>
            <Label>Price per Slice</Label>
            <Input
              type="number"
              value={form.price_per_slice}
              onChange={(e) => setForm({ ...form, price_per_slice: e.target.value })}
            />
          </div>
          <RecipeEditor
            ingredients={ingredients}
            rows={createRecipeRows}
            onChange={setCreateRecipeRows}
          />
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Adding..." : "Add Plate"}
          </Button>
        </form>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 lg:col-span-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3">Name</th>
                <th className="pb-3">Weight (kg)</th>
                <th className="pb-3">Ingredients</th>
                <th className="pb-3">¼</th>
                <th className="pb-3">½</th>
                <th className="pb-3">Kilo</th>
                <th className="pb-3">Slice</th>
                <th className="pb-3">Active</th>
                <th className="pb-3">Recipe</th>
              </tr>
            </thead>
            <tbody>
              {dishes.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3">{d.name}</td>
                  <td className="py-3">{formatNumber(plateWeightToKg(d.plate_weight_grams))}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{recipeSummary(d)}</td>
                  <td className="py-3">{d.price_quarter ?? "-"}</td>
                  <td className="py-3">{d.price_half ?? "-"}</td>
                  <td className="py-3">{d.price_kilo ?? "-"}</td>
                  <td className="py-3">{d.price_per_slice ?? "-"}</td>
                  <td className="py-3">
                    <button onClick={() => toggleActive(d)} className="text-brand-500">
                      {d.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-3">
                    <button onClick={() => openRecipeEditor(d)} className="text-brand-500">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!editingDish} onClose={closeRecipeEditor} className="max-w-lg p-6 m-4">
        <form onSubmit={handleSaveRecipe} className="space-y-4">
          <h3 className="text-lg font-semibold">
            Edit Recipe — {editingDish?.name}
          </h3>
          <RecipeEditor
            ingredients={ingredients}
            rows={editRecipeRows}
            onChange={setEditRecipeRows}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving..." : "Save Recipe"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={closeRecipeEditor}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
