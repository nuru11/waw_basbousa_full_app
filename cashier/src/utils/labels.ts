import i18n from "../i18n";

export function weightTypeLabel(weightType: string) {
  return i18n.t(`common:weightTypes.${weightType}`, { defaultValue: weightType });
}

export function paymentMethodLabel(method: string) {
  return i18n.t(`common:paymentMethods.${method}`, { defaultValue: method });
}

export function getRoleLabel(role: string) {
  return i18n.t(`common:roles.${role}`, { defaultValue: role });
}
