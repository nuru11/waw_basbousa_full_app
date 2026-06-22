import type { ReactNode } from "react";
import type { Purchase } from "../../../services/api";
import Badge from "../badge/Badge";

export type StatusBadgeVariant =
  | "pending"
  | "approved"
  | "received"
  | "handed"
  | "in_inventory"
  | "rejected"
  | "cancelled"
  | "active"
  | "low_stock"
  | "profitable"
  | "loss"
  | "cash"
  | "cbe"
  | "telebirr"
  | "awash"
  | "dashen"
  | "abyssinia"
  | "nib"
  | "coop"
  | "other"
  | "info";

type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light";

const variantMap: Record<StatusBadgeVariant, BadgeColor> = {
  pending: "warning",
  approved: "success",
  received: "success",
  handed: "primary",
  in_inventory: "info",
  rejected: "error",
  cancelled: "error",
  active: "success",
  low_stock: "error",
  profitable: "success",
  loss: "error",
  cash: "success",
  cbe: "primary",
  telebirr: "info",
  awash: "error",
  dashen: "primary",
  abyssinia: "success",
  nib: "info",
  coop: "warning",
  other: "light",
  info: "info",
};

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children: ReactNode;
  size?: "sm" | "md";
}

export default function StatusBadge({
  variant,
  children,
  size = "sm",
}: StatusBadgeProps) {
  return (
    <Badge variant="light" color={variantMap[variant]} size={size}>
      {children}
    </Badge>
  );
}

export function purchaseStatusVariant(
  status: Purchase["status"]
): StatusBadgeVariant {
  switch (status) {
    case "received":
      return "received";
    case "handed":
      return "handed";
    case "in_inventory":
      return "in_inventory";
    case "pending":
      return "pending";
    default:
      return "pending";
  }
}

export function paymentMethodVariant(method: string): StatusBadgeVariant {
  switch (method) {
    case "cash":
      return "cash";
    case "cbe":
      return "cbe";
    case "telebirr":
      return "telebirr";
    case "awash":
      return "awash";
    case "dashen":
      return "dashen";
    case "abyssinia":
      return "abyssinia";
    case "nib":
      return "nib";
    case "coop":
      return "coop";
    case "other":
      return "other";
    default:
      return "other";
  }
}
