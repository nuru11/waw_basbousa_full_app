import { api, type Dish, type PosDefaultPrices } from "../services/api";
import type { WeightType } from "./posColors";
import { PORTION_WEIGHT_GRAMS } from "./portionWeights";

export type PriceSource = PosDefaultPrices;

export const PRICE_FIELDS: Record<WeightType, keyof PriceSource> = {
  quarter: "price_quarter",
  half: "price_half",
  kilo: "price_kilo",
  slice: "price_per_slice",
  half_slice: "price_half_slice",
};

export function parsePositivePrice(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = parseFloat(String(value));
  return n > 0 ? n : null;
}

export function normalizePrices(data: unknown): PosDefaultPrices | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const prices: PosDefaultPrices = {
    price_quarter: (row.price_quarter as PosDefaultPrices["price_quarter"]) ?? null,
    price_half: (row.price_half as PosDefaultPrices["price_half"]) ?? null,
    price_kilo: (row.price_kilo as PosDefaultPrices["price_kilo"]) ?? null,
    price_per_slice: (row.price_per_slice as PosDefaultPrices["price_per_slice"]) ?? null,
    price_half_slice: (row.price_half_slice as PosDefaultPrices["price_half_slice"]) ?? null,
  };
  const hasAny = Object.values(PRICE_FIELDS).some(
    (field) => parsePositivePrice(prices[field]) != null
  );
  return hasAny ? prices : null;
}

export async function loadCashierPrices(): Promise<PosDefaultPrices | null> {
  try {
    const defaults = await api.get<PosDefaultPrices>("/dishes/pos-default-prices");
    const normalized = normalizePrices(defaults);
    if (normalized) return normalized;
  } catch {
    // fall through to dish prices for employee
  }

  try {
    const dishes = await api.get<
      {
        price_quarter: PosDefaultPrices["price_quarter"];
        price_half: PosDefaultPrices["price_half"];
        price_kilo: PosDefaultPrices["price_kilo"];
        price_per_slice: PosDefaultPrices["price_per_slice"];
        price_half_slice: PosDefaultPrices["price_half_slice"];
      }[]
    >("/dishes?active=true");
    for (const dish of dishes) {
      const normalized = normalizePrices(dish);
      if (normalized) return normalized;
    }
  } catch {
    // ignore
  }

  return null;
}

export function priceSourceFromDish(dish: Dish | null | undefined): PosDefaultPrices | null {
  if (!dish) return null;
  return normalizePrices(dish);
}

export function calcPrice(
  source: PriceSource | null,
  weightType: WeightType,
  qty: number,
  slices: number
) {
  if (!source) return 0;
  const unit = parsePositivePrice(source[PRICE_FIELDS[weightType]]);
  if (unit === null) return 0;
  if (weightType === "slice") return unit * slices * qty;
  return unit * qty;
}

function roundKg(kg: number, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round(kg * factor) / factor;
}

export function calcKiloConsumed(weightType: WeightType, qty: number, slices: number) {
  const grams = PORTION_WEIGHT_GRAMS[weightType];
  if (grams == null) return 0;

  const kg =
    weightType === "slice"
      ? (grams / 1000) * slices * qty
      : (grams / 1000) * qty;

  return roundKg(kg);
}

export const DEFAULT_KILO_MANUAL_KG = String(calcKiloConsumed("kilo", 1, 1));
