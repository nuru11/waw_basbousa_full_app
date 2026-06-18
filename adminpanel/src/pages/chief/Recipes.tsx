import { useEffect, useState, type FormEvent } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Dish, type Ingredient } from "../../services/api";

export default function RecipesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedDish, setSelectedDish] = useState<number | "">("");
  const [plateWeight, setPlateWeight] = useState("");
  const [recipeRows, setRecipeRows] = useState<
    { ingredient_id: string; quantity_per_plate: string }[]
  >([{ ingredient_id: "", quantity_per_plate: "" }]);
  const [message, setMessage] = useState("");
  const { submitting, run } = useSubmitLock();

  useEffect(() => {
    api.get<Dish[]>("/dishes").then(setDishes);
    api.get<Ingredient[]>("/ingredients").then(setIngredients);
  }, []);

  useEffect(() => {
    if (!selectedDish) return;
    const dish = dishes.find((d) => d.id === selectedDish);
    if (dish) {
      setPlateWeight(String(dish.plate_weight_grams || ""));
      if (dish.recipe && dish.recipe.length > 0) {
        setRecipeRows(
          dish.recipe.map((r) => ({
            ingredient_id: String(r.ingredient_id),
            quantity_per_plate: String(r.quantity_per_plate),
          }))
        );
      } else {
        setRecipeRows([{ ingredient_id: "", quantity_per_plate: "" }]);
      }
    }
  }, [selectedDish, dishes]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedDish) return;
    await run(async () => {
      try {
        await api.put(`/dishes/${selectedDish}/recipe`, {
          plate_weight_grams: plateWeight ? parseFloat(plateWeight) : null,
          recipe: recipeRows
            .filter((r) => r.ingredient_id && r.quantity_per_plate)
            .map((r) => ({
              ingredient_id: parseInt(r.ingredient_id),
              quantity_per_plate: parseFloat(r.quantity_per_plate),
            })),
        });
        setMessage("Recipe saved");
        const updated = await api.get<Dish[]>("/dishes");
        setDishes(updated);
      } catch (err: unknown) {
        setMessage(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div>
      <PageMeta title="Recipes | Restaurant" description="Dish recipes" />
      <PageBreadcrumb pageTitle="Recipes (Bottles per Plate)" />
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl p-5 space-y-4 rounded-2xl border border-gray-200 dark:border-gray-800"
      >
        {message && <p className="text-sm text-brand-500">{message}</p>}
        <div>
          <Label>Select Dish</Label>
          <select
            className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
            value={selectedDish}
            onChange={(e) =>
              setSelectedDish(e.target.value ? parseInt(e.target.value) : "")
            }
          >
            <option value="">Choose dish</option>
            {dishes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Plate Weight (grams)</Label>
          <Input
            type="number"
            value={plateWeight}
            onChange={(e) => setPlateWeight(e.target.value)}
          />
        </div>
        <div>
          <Label>Ingredients per Plate</Label>
          {recipeRows.map((row, idx) => (
            <div key={idx} className="flex gap-2 mt-2">
              <select
                className="flex-1 h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
                value={row.ingredient_id}
                onChange={(e) => {
                  const next = [...recipeRows];
                  next[idx].ingredient_id = e.target.value;
                  setRecipeRows(next);
                }}
              >
                <option value="">Ingredient</option>
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                step={0.001}
                placeholder="Qty/plate"
                value={row.quantity_per_plate}
                onChange={(e) => {
                  const next = [...recipeRows];
                  next[idx].quantity_per_plate = e.target.value;
                  setRecipeRows(next);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="mt-2 text-sm text-brand-500"
            onClick={() =>
              setRecipeRows([
                ...recipeRows,
                { ingredient_id: "", quantity_per_plate: "" },
              ])
            }
          >
            + Add ingredient
          </button>
        </div>
        <Button type="submit" size="sm" disabled={!selectedDish || submitting}>
          {submitting ? "Saving..." : "Save Recipe"}
        </Button>
      </form>
    </div>
  );
}
