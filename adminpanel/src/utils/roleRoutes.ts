import i18n from "../i18n";
import type { User } from "../services/api";

export function getRoleHome(role: User["role"]): string {
  switch (role) {
    case "superAdmin":
      return "/admin/dashboard";
    case "purchaser":
      return "/purchaser/purchases";
    case "chief":
      return "/chief/inventory";
    case "employee":
      return "/employee/production";
    default:
      return "/signin";
  }
}

export function getRoleLabel(role: User["role"]): string {
  return i18n.t(`common:roles.${role}`);
}
