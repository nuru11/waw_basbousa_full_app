import i18n from "../i18n";
import type { Purchase } from "../services/api";

export function purchaseStatusLabel(status: Purchase["status"]) {
  return i18n.t(`common:purchaseStatus.${status}`, { defaultValue: status });
}

export function weightTypeLabel(weightType: string) {
  return i18n.t(`common:weightTypes.${weightType}`, { defaultValue: weightType });
}

export function paymentMethodLabel(method: string) {
  return i18n.t(`common:paymentMethods.${method}`, { defaultValue: method });
}

export function unitLabel(unit: string) {
  return i18n.t(`common:units.${unit}`, { defaultValue: unit });
}

export function purchaseSizeLabel(size: 'small' | 'large' | null | undefined) {
  if (!size) return "";
  return i18n.t(`common:purchaseSizes.${size}`, { defaultValue: size });
}
