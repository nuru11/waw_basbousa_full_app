import type { PaymentMethod } from "./paymentMethods";

export type { PaymentMethod };
export type SectionAccent = "plate" | "portion" | "payment" | "cart" | "default";
export type WeightType = "quarter" | "half" | "kilo" | "slice";

type ChoiceColors = { selected: string; idle: string; pill: string };

export const foodChoiceColors = {
  selected:
    "border-brand-600 bg-brand-600 text-white shadow-theme-sm ring-2 ring-brand-600/20 dark:border-brand-500 dark:bg-brand-500",
  idle:
    "border-gray-200 bg-white text-gray-800 hover:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:hover:border-brand-700",
};

export const portionColors: Record<WeightType, ChoiceColors> = {
  quarter: {
    selected:
      "border-brand-600 bg-brand-600 text-white shadow-theme-sm dark:bg-brand-500 dark:border-brand-500",
    idle:
      "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300",
    pill: "bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300",
  },
  half: {
    selected:
      "border-brand-600 bg-brand-600 text-white shadow-theme-sm dark:bg-brand-500 dark:border-brand-500",
    idle:
      "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300",
    pill: "bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300",
  },
  kilo: {
    selected:
      "border-brand-700 bg-brand-700 text-white shadow-theme-sm dark:bg-brand-600 dark:border-brand-600",
    idle:
      "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300",
    pill: "bg-brand-100 text-brand-800 dark:bg-brand-500/25 dark:text-brand-300",
  },
  slice: {
    selected:
      "border-brand-600 bg-brand-600 text-white shadow-theme-sm dark:bg-brand-500 dark:border-brand-500",
    idle:
      "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300",
    pill: "bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300",
  },
};

const paymentIdleClasses =
  "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600";

export const paymentColors: Record<PaymentMethod, Omit<ChoiceColors, "pill">> = {
  cash: {
    selected:
      "border-pay-cash-500 bg-pay-cash-500 text-white shadow-theme-sm dark:bg-pay-cash-600 dark:border-pay-cash-500",
    idle: paymentIdleClasses,
  },
  cbe: {
    selected:
      "border-pay-cbe-500 bg-pay-cbe-500 text-white shadow-theme-sm dark:bg-pay-cbe-600 dark:border-pay-cbe-500",
    idle: paymentIdleClasses,
  },
  telebirr: {
    selected:
      "border-pay-telebirr-500 bg-pay-telebirr-500 text-white shadow-theme-sm dark:bg-pay-telebirr-600 dark:border-pay-telebirr-500",
    idle: paymentIdleClasses,
  },
  awash: {
    selected:
      "border-pay-awash-500 bg-pay-awash-500 text-white shadow-theme-sm dark:bg-pay-awash-600 dark:border-pay-awash-500",
    idle: paymentIdleClasses,
  },
  dashen: {
    selected:
      "border-pay-dashen-500 bg-pay-dashen-500 text-white shadow-theme-sm dark:bg-pay-dashen-600 dark:border-pay-dashen-500",
    idle: paymentIdleClasses,
  },
  abyssinia: {
    selected:
      "border-pay-abyssinia-600 bg-pay-abyssinia-500 text-gray-900 shadow-theme-sm ring-2 ring-pay-abyssinia-600/30 dark:text-gray-900",
    idle: paymentIdleClasses,
  },
  nib: {
    selected:
      "border-pay-nib-500 bg-pay-nib-500 text-white shadow-theme-sm dark:bg-pay-nib-600 dark:border-pay-nib-500",
    idle: paymentIdleClasses,
  },
  coop: {
    selected:
      "border-pay-coop-500 bg-pay-coop-500 text-white shadow-theme-sm dark:bg-pay-coop-600 dark:border-pay-coop-500",
    idle: paymentIdleClasses,
  },
  other: {
    selected:
      "border-pay-other-500 bg-pay-other-500 text-white shadow-theme-sm dark:bg-pay-other-600 dark:border-pay-other-500",
    idle: paymentIdleClasses,
  },
};

export const sectionAccentClasses: Record<SectionAccent, string> = {
  plate: "pos-section-plate",
  portion: "pos-section-portion",
  payment: "pos-section-payment",
  cart: "pos-section-cart",
  default: "pos-card",
};

export const sectionTitleClasses: Record<SectionAccent, string> = {
  plate: "text-brand-600 dark:text-brand-400",
  portion: "text-gray-700 dark:text-gray-300",
  payment: "text-gray-700 dark:text-gray-300",
  cart: "text-gray-700 dark:text-gray-300",
  default: "text-gray-600 dark:text-gray-400",
};

export type StockStatus = "ok" | "low" | "out";

export function stockStatusColor(availableKg: number, neededKg: number): StockStatus {
  if (neededKg > availableKg + 0.0001) return "out";
  if (availableKg < 1 || neededKg > availableKg * 0.5) return "low";
  return "ok";
}

export const stockBannerClasses: Record<StockStatus, string> = {
  ok: "bg-pos-emerald-50 border-pos-emerald-200 text-pos-emerald-800 dark:bg-pos-emerald-500/15 dark:border-pos-emerald-700 dark:text-pos-emerald-300",
  low: "bg-pos-amber-50 border-pos-amber-200 text-pos-amber-800 dark:bg-pos-amber-500/15 dark:border-pos-amber-700 dark:text-pos-amber-300",
  out: "bg-error-50 border-error-200 text-error-600 dark:bg-error-500/15 dark:border-error-700 dark:text-error-400",
};
