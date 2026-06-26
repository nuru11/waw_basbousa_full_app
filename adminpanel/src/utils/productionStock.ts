export function productionIngredientUsed(
  quantityPerPlate: number,
  platesCount: number
): number {
  return quantityPerPlate * platesCount;
}

export function maxPlatesFromStock(
  recipe: { ingredient_id: number; quantity_per_plate: string | number }[],
  stockByIngredientId: Map<number, number>,
  platesCount = 1
): number {
  const neededByIngredient = new Map<number, number>();

  for (const item of recipe) {
    const qty = parseFloat(String(item.quantity_per_plate)) * platesCount;
    if (qty <= 0) continue;
    neededByIngredient.set(
      item.ingredient_id,
      (neededByIngredient.get(item.ingredient_id) ?? 0) + qty
    );
  }

  let max = Infinity;
  for (const [ingredientId, needed] of neededByIngredient) {
    const available = stockByIngredientId.get(ingredientId) ?? 0;
    max = Math.min(max, Math.floor(available / needed));
  }

  return max === Infinity ? 0 : max;
}
