/**
 * Display stored plate_weight_grams as kilograms for forms.
 * Legacy: values under 100 were saved as kg in a grams-labelled field.
 */
export function plateWeightToKg(stored: string | number | null | undefined): number {
  const w = parseFloat(String(stored ?? 0)) || 0;
  if (w <= 0) return 0;
  if (w < 100) return w;
  return w / 1000;
}

export function kgToStoredGrams(kg: number): number {
  if (kg <= 0) return 0;
  return kg * 1000;
}
