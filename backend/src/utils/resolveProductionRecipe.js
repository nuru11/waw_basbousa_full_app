const SIZE_PRIORITY = ['large', 'small'];

function recipeUsageKey(ingredientId, size) {
  return `${ingredientId}:${size ?? ''}`;
}

function quantityUsed(item, platesCount, usageByKey) {
  const key = recipeUsageKey(item.ingredient_id, item.size ?? null);
  if (usageByKey && usageByKey.has(key)) {
    return usageByKey.get(key);
  }
  return parseFloat(item.quantity_per_plate) * platesCount;
}

function resolveActiveSizeForGroup(group, stock, platesCount, usageByKey) {
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

function groupRecipeItems(recipe, hasSizeByIngredientId) {
  const groups = [];
  const groupByIngredientId = new Map();

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

function resolveProductionRecipe(
  recipe,
  stockByIngredientId,
  hasSizeByIngredientId,
  platesCount,
  usageByKey = null
) {
  const groups = groupRecipeItems(recipe, hasSizeByIngredientId);
  const effective = [];

  for (const group of groups) {
    const stock = stockByIngredientId.get(group[0].ingredient_id) ?? 0;
    effective.push(
      resolveActiveSizeForGroup(group, stock, platesCount, usageByKey)
    );
  }

  return effective;
}

module.exports = {
  recipeUsageKey,
  resolveProductionRecipe,
  resolveActiveSizeForGroup,
  quantityUsed,
};
