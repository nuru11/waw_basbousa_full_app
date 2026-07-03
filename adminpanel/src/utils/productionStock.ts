import {
  productionQuantityUsed,
  resolveActiveSizeForGroup,
  type ProductionRecipeItem,
} from "./resolveProductionRecipe";

export function productionIngredientUsed(
  quantityPerPlate: number,
  platesCount: number
): number {
  return quantityPerPlate * platesCount;
}

function groupRecipeItems(
  recipe: ProductionRecipeItem[],
  hasSizeByIngredientId: Map<number, boolean>
): ProductionRecipeItem[][] {
  const groups: ProductionRecipeItem[][] = [];
  const groupByIngredientId = new Map<number, ProductionRecipeItem[]>();

  for (const item of recipe) {
    const hasSize = hasSizeByIngredientId.get(item.ingredient_id);
    if (!hasSize) {
      groups.push([item]);
      continue;
    }

    let group = groupByIngredientId.get(item.ingredient_id);
    if (!group) {
      group = [];
      groupByIngredientId.set(item.ingredient_id, group);
      groups.push(group);
    }
    group.push(item);
  }

  return groups;
}

function maxPlatesForGroup(
  group: ProductionRecipeItem[],
  stock: number,
  templatePlatesCount: number
): number {
  if (group.length === 1) {
    const qty =
      parseFloat(String(group[0].quantity_per_plate)) * templatePlatesCount;
    if (qty <= 0) return Infinity;
    return Math.floor(stock / qty);
  }

  let max = 0;
  for (const size of ["large", "small"] as const) {
    const item = group.find((entry) => entry.size === size);
    if (!item) continue;

    const qty =
      parseFloat(String(item.quantity_per_plate)) * templatePlatesCount;
    if (qty <= 0) continue;

    const platesAtSize = Math.floor(stock / qty);
    if (size === "large" && platesAtSize >= 1) {
      return platesAtSize;
    }
    max = Math.max(max, platesAtSize);
  }

  return max;
}

export function maxPlatesFromStock(
  recipe: ProductionRecipeItem[],
  stockByIngredientId: Map<number, number>,
  hasSizeByIngredientId: Map<number, boolean>,
  platesCount = 1
): number {
  const groups = groupRecipeItems(recipe, hasSizeByIngredientId);

  let max = Infinity;
  for (const group of groups) {
    const stock = stockByIngredientId.get(group[0].ingredient_id) ?? 0;
    const needed = maxPlatesForGroup(group, stock, platesCount);
    max = Math.min(max, needed);
  }

  return max === Infinity ? 0 : max;
}

export function maxPlatesFromStockWithUsage(
  recipe: ProductionRecipeItem[],
  stockByIngredientId: Map<number, number>,
  hasSizeByIngredientId: Map<number, boolean>,
  platesCount: number,
  usageByKey: Map<string, number>
): number {
  const groups = groupRecipeItems(recipe, hasSizeByIngredientId);

  let max = Infinity;
  for (const group of groups) {
    const stock = stockByIngredientId.get(group[0].ingredient_id) ?? 0;
    const active = resolveActiveSizeForGroup(
      group,
      stock,
      platesCount,
      usageByKey
    );
    const needed = productionQuantityUsed(active, platesCount, usageByKey);
    if (needed <= 0) continue;
    max = Math.min(max, Math.floor(stock / needed));
  }

  return max === Infinity ? 0 : max;
}
