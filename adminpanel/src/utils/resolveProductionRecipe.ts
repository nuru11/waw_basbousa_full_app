export type ProductionRecipeItem = {
  ingredient_id: number;
  quantity_per_plate: string | number;
  size?: "small" | "large" | null;
};

const SIZE_PRIORITY: Array<"large" | "small"> = ["large", "small"];

export function recipeUsageKey(
  ingredientId: number,
  size: string | null | undefined
): string {
  return `${ingredientId}:${size ?? ""}`;
}

function quantityUsed(
  item: ProductionRecipeItem,
  platesCount: number,
  usageByKey?: Map<string, number>
): number {
  const key = recipeUsageKey(item.ingredient_id, item.size);
  if (usageByKey?.has(key)) {
    return usageByKey.get(key)!;
  }
  return parseFloat(String(item.quantity_per_plate)) * platesCount;
}

export function resolveActiveSizeForGroup(
  group: ProductionRecipeItem[],
  stock: number,
  platesCount: number,
  usageByKey?: Map<string, number>
): ProductionRecipeItem {
  if (group.length === 1) {
    return group[0];
  }

  for (const size of SIZE_PRIORITY) {
    const item = group.find((entry) => entry.size === size);
    if (!item) continue;

    const used = quantityUsed(item, platesCount, usageByKey);
    if (stock >= used) {
      return item;
    }
  }

  const fallbackOrder = [...SIZE_PRIORITY].reverse();
  for (const size of fallbackOrder) {
    const item = group.find((entry) => entry.size === size);
    if (item) return item;
  }

  return group[0];
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

export function resolveProductionRecipe(
  recipe: ProductionRecipeItem[],
  stockByIngredientId: Map<number, number>,
  hasSizeByIngredientId: Map<number, boolean>,
  platesCount: number,
  usageByKey?: Map<string, number>
): ProductionRecipeItem[] {
  const groups = groupRecipeItems(recipe, hasSizeByIngredientId);
  const effective: ProductionRecipeItem[] = [];

  for (const group of groups) {
    const stock = stockByIngredientId.get(group[0].ingredient_id) ?? 0;
    effective.push(
      resolveActiveSizeForGroup(group, stock, platesCount, usageByKey)
    );
  }

  return effective;
}

export function productionQuantityUsed(
  item: ProductionRecipeItem,
  platesCount: number,
  usageByKey?: Map<string, number>
): number {
  return quantityUsed(item, platesCount, usageByKey);
}
