export const PAYMENT_OPTIONS = [
  "cash",
  "cbe",
  "telebirr",
  "awash",
  "dashen",
  "abyssinia",
  "nib",
  "coop",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_OPTIONS)[number];

export type DailySalesPayments = Record<PaymentMethod, number>;
