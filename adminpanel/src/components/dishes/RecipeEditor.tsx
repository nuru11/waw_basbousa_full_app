import { useTranslation } from "react-i18next";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import type { Ingredient } from "../../services/api";

export type RecipeRow = {
  ingredient_id: string;
  quantity_per_plate: string;
  quantity_small: string;
  quantity_large: string;
};

export type ParsedRecipeItem = {
  ingredient_id: number;
  quantity_per_plate: number;
  size: "small" | "large" | null;
};

export const emptyRecipeRow = (): RecipeRow => ({
  ingredient_id: "",
  quantity_per_plate: "",
  quantity_small: "",
  quantity_large: "",
});

type RecipeEditorProps = {
  ingredients: Ingredient[];
  rows: RecipeRow[];
  onChange: (rows: RecipeRow[]) => void;
};

export class RecipeParseError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "RecipeParseError";
  }
}

export function parseRecipeRows(
  rows: RecipeRow[],
  ingredients: Ingredient[]
): ParsedRecipeItem[] {
  const result: ParsedRecipeItem[] = [];

  for (const row of rows) {
    if (!row.ingredient_id) continue;

    const ingredient = ingredients.find((i) => String(i.id) === row.ingredient_id);
    if (!ingredient) continue;

    if (ingredient.has_size) {
      const smallQty = row.quantity_small ? parseFloat(row.quantity_small) : 0;
      const largeQty = row.quantity_large ? parseFloat(row.quantity_large) : 0;

      if (smallQty <= 0 && largeQty <= 0) {
        throw new RecipeParseError("RECIPE_SIZE_QTY_REQUIRED");
      }

      if (smallQty > 0) {
        result.push({
          ingredient_id: ingredient.id,
          quantity_per_plate: smallQty,
          size: "small",
        });
      }
      if (largeQty > 0) {
        result.push({
          ingredient_id: ingredient.id,
          quantity_per_plate: largeQty,
          size: "large",
        });
      }
    } else if (row.quantity_per_plate) {
      const qty = parseFloat(row.quantity_per_plate);
      if (qty > 0) {
        result.push({
          ingredient_id: ingredient.id,
          quantity_per_plate: qty,
          size: null,
        });
      }
    }
  }

  return result;
}

function unitLabel(unit: string, t: (key: string, options?: { defaultValue?: string }) => string) {
  return t(`units.${unit}`, { defaultValue: unit });
}

function qtyPlaceholder(
  unit: string | undefined,
  t: (key: string, options?: Record<string, string>) => string
) {
  if (!unit) return t("recipe.qtyPerPlate");
  const label = unitLabel(unit, t);
  if (unit === "bottle") {
    return t("recipe.qtyWithUnitExample", { unit: label, example: "0.5" });
  }
  return t("recipe.qtyWithUnit", { unit: label });
}

export function recipeRowsFromDish(
  recipe?: {
    ingredient_id: number;
    quantity_per_plate: string | number;
    size?: "small" | "large" | null;
  }[]
): RecipeRow[] {
  if (!recipe || recipe.length === 0) {
    return [emptyRecipeRow()];
  }

  const grouped = new Map<number, RecipeRow>();

  for (const item of recipe) {
    let row = grouped.get(item.ingredient_id);
    if (!row) {
      row = {
        ingredient_id: String(item.ingredient_id),
        quantity_per_plate: "",
        quantity_small: "",
        quantity_large: "",
      };
      grouped.set(item.ingredient_id, row);
    }

    if (item.size === "small") {
      row.quantity_small = String(item.quantity_per_plate);
    } else if (item.size === "large") {
      row.quantity_large = String(item.quantity_per_plate);
    } else {
      row.quantity_per_plate = String(item.quantity_per_plate);
    }
  }

  return Array.from(grouped.values());
}

export default function RecipeEditor({ ingredients, rows, onChange }: RecipeEditorProps) {
  const { t } = useTranslation("common");

  function updateRow(idx: number, field: keyof RecipeRow, value: string) {
    const next = [...rows];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  }

  function updateIngredient(idx: number, ingredient_id: string) {
    const next = [...rows];
    next[idx] = {
      ingredient_id,
      quantity_per_plate: "",
      quantity_small: "",
      quantity_large: "",
    };
    onChange(next);
  }

  return (
    <div>
      <Label>{t("recipe.ingredientsPerPlate")}</Label>
      <p className="mt-1 text-xs text-gray-500">{t("recipe.fractionalQtyHint")}</p>
      {rows.map((row, idx) => {
        const ingredient = ingredients.find((i) => String(i.id) === row.ingredient_id);
        const unit = ingredient?.unit;
        const hasSize = ingredient?.has_size ?? false;
        const unitText = unit ? unitLabel(unit, t) : undefined;

        return (
          <div key={idx} className="mt-2 space-y-2">
            <select
              className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
              value={row.ingredient_id}
              onChange={(e) => updateIngredient(idx, e.target.value)}
            >
              <option value="">{t("recipe.ingredientOption")}</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({unitLabel(i.unit, t)})
                </option>
              ))}
            </select>
            {hasSize ? (
              <div className="flex gap-2">
                <Input
                  type="number"
                  step={0.001}
                  placeholder={
                    unitText
                      ? unit === "bottle"
                        ? t("recipe.qtyWithUnitExample", { unit: unitText, example: "0.5" })
                        : t("recipe.qtySmallPerPlate", { unit: unitText })
                      : t("recipe.qtySmallPerPlateShort")
                  }
                  value={row.quantity_small}
                  onChange={(e) => updateRow(idx, "quantity_small", e.target.value)}
                />
                <Input
                  type="number"
                  step={0.001}
                  placeholder={
                    unitText
                      ? unit === "bottle"
                        ? t("recipe.qtyWithUnitExample", { unit: unitText, example: "0.25" })
                        : t("recipe.qtyLargePerPlate", { unit: unitText })
                      : t("recipe.qtyLargePerPlateShort")
                  }
                  value={row.quantity_large}
                  onChange={(e) => updateRow(idx, "quantity_large", e.target.value)}
                />
              </div>
            ) : (
              <Input
                type="number"
                step={0.001}
                placeholder={qtyPlaceholder(unit, t)}
                value={row.quantity_per_plate}
                onChange={(e) => updateRow(idx, "quantity_per_plate", e.target.value)}
              />
            )}
          </div>
        );
      })}
      <button
        type="button"
        className="mt-2 text-sm text-brand-500"
        onClick={() => onChange([...rows, emptyRecipeRow()])}
      >
        {t("recipe.addIngredient")}
      </button>
    </div>
  );
}
