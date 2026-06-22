import type { User } from "../services/api";

const CASHIER_ROLES: User["role"][] = ["employee", "chief"];

export function isCashierRole(role: User["role"]): boolean {
  return CASHIER_ROLES.includes(role);
}

export function getHomePath(): string {
  return "/";
}
