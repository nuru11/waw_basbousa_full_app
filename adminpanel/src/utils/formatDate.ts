import i18n, { getIntlLocale } from "../i18n";

export function getDateFromValue(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelativeDate(value: string | undefined): string {
  const date = getDateFromValue(value);
  if (!date) return i18n.t("common:emDash");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return i18n.t("common:today");
  if (diffDays === 1) return i18n.t("common:yesterday");
  if (diffDays > 1 && diffDays < 7) return i18n.t("common:daysAgo", { count: diffDays });
  if (diffDays >= 7 && diffDays < 14) return i18n.t("common:lastWeek");
  return date.toLocaleDateString(getIntlLocale());
}

export function formatShortDate(value: string | undefined): string {
  const date = getDateFromValue(value);
  if (!date) return i18n.t("common:emDash");
  return date.toLocaleDateString(getIntlLocale());
}

export function formatDateTime(value: string | undefined): string {
  const date = getDateFromValue(value);
  if (!date) return i18n.t("common:emDash");
  return date.toLocaleString(getIntlLocale());
}

export function formatTime(value: string | undefined): string {
  const date = getDateFromValue(value);
  if (!date) return i18n.t("common:emDash");
  return date.toLocaleTimeString(getIntlLocale());
}
