import { getIntlLocale } from "../i18n";

export function formatCurrency(amount: number, locale?: string): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(amount);
}
