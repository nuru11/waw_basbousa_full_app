/**
 * Convert stored plate_weight_grams to kilograms.
 * Legacy data: values under 100 were entered as kg in a grams-labelled field (e.g. 28 = 28 kg).
 */
function plateWeightToKg(stored) {
  const w = parseFloat(stored || 0);
  if (w <= 0) return 0;
  if (w < 100) return w;
  return w / 1000;
}

function kgToStoredGrams(kg) {
  const k = parseFloat(kg || 0);
  if (k <= 0) return 0;
  return k * 1000;
}

module.exports = { plateWeightToKg, kgToStoredGrams };
