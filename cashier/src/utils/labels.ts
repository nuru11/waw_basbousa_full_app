import i18n from "../i18n";
import type { Sale } from "../services/api";

export function weightTypeLabel(weightType: string | null | undefined) {
  if (!weightType) return i18n.t("common:emDash");
  return i18n.t(`common:weightTypes.${weightType}`, { defaultValue: weightType });
}

type SaleLabelInput = Pick<
  Sale,
  "sale_type" | "weight_type" | "slice_count" | "quantity" | "water_bottle_size"
>;

export function formatSalePortion(sale: SaleLabelInput) {
  const qty = sale.quantity ?? 1;

  if (sale.sale_type === "coffee") {
    const label = i18n.t("common:coffee.itemName");
    return qty > 1 ? `${label} × ${qty}` : label;
  }

  if (sale.sale_type === "water") {
    const label =
      sale.water_bottle_size === "large"
        ? i18n.t("common:water.largeBottle")
        : i18n.t("common:water.smallBottle");
    return qty > 1 ? `${label} × ${qty}` : label;
  }

  const weightType = sale.weight_type;
  if (!weightType) return i18n.t("common:emDash");

  const portion =
    weightType === "slice" && sale.slice_count
      ? i18n.t("common:units.slices", { count: sale.slice_count })
      : weightTypeLabel(weightType);

  return qty > 1 ? `${portion} × ${qty}` : portion;
}

export function formatSaleItemName(sale: SaleLabelInput & { dish?: { name?: string } | null }) {
  if (sale.sale_type === "coffee") return i18n.t("common:coffee.itemName");
  if (sale.sale_type === "water") return i18n.t("common:water.itemName");
  return sale.dish?.name ?? i18n.t("common:sales.generalSale");
}

export function salePortionPillClass(sale: SaleLabelInput): string {
  if (sale.sale_type === "coffee") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300";
  }
  if (sale.sale_type === "water") {
    return sale.water_bottle_size === "large"
      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300"
      : "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300";
  }
  return "";
}

export function paymentMethodLabel(method: string) {
  return i18n.t(`common:paymentMethods.${method}`, { defaultValue: method });
}

export function getRoleLabel(role: string) {
  return i18n.t(`common:roles.${role}`, { defaultValue: role });
}
