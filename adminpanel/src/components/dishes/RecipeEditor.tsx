import Label from "../form/Label";
import Input from "../form/input/InputField";
import type { Ingredient } from "../../services/api";

export type RecipeRow = {
  ingredient_id: string;
  quantity_per_plate: string;
};

type RecipeEditorProps = {
  ingredients: Ingredient[];
  rows: RecipeRow[];
  onChange: (rows: RecipeRow[]) => void;
};

export function parseRecipeRows(rows: RecipeRow[]) {
  return rows
    .filter((r) => r.ingredient_id && r.quantity_per_plate)
    .map((r) => ({
      ingredient_id: parseInt(r.ingredient_id),
      quantity_per_plate: parseFloat(r.quantity_per_plate),
    }));
}

export function recipeRowsFromDish(
  recipe?: { ingredient_id: number; quantity_per_plate: string | number }[]
): RecipeRow[] {
  if (recipe && recipe.length > 0) {
    return recipe.map((r) => ({
      ingredient_id: String(r.ingredient_id),
      quantity_per_plate: String(r.quantity_per_plate),
    }));
  }
  return [{ ingredient_id: "", quantity_per_plate: "" }];
}

export default function RecipeEditor({ ingredients, rows, onChange }: RecipeEditorProps) {
  function updateRow(idx: number, field: keyof RecipeRow, value: string) {
    const next = [...rows];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  }

  return (
    <div>
      <Label>Ingredients per Plate</Label>
      {rows.map((row, idx) => {
        const unit = ingredients.find((i) => String(i.id) === row.ingredient_id)?.unit;
        return (
          <div key={idx} className="flex gap-2 mt-2">
            <select
              className="flex-1 h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
              value={row.ingredient_id}
              onChange={(e) => updateRow(idx, "ingredient_id", e.target.value)}
            >
              <option value="">Ingredient</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
            <Input
              type="number"
              step={0.001}
              placeholder={unit ? `Qty (${unit})` : "Qty/plate"}
              value={row.quantity_per_plate}
              onChange={(e) => updateRow(idx, "quantity_per_plate", e.target.value)}
            />
          </div>
        );
      })}
      <button
        type="button"
        className="mt-2 text-sm text-brand-500"
        onClick={() => onChange([...rows, { ingredient_id: "", quantity_per_plate: "" }])}
      >
        + Add ingredient
      </button>
    </div>
  );
}
