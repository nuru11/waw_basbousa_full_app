import i18n from "../i18n";
import type { Purchase, Sale } from "../services/api";

export function purchaseStatusLabel(status: Purchase["status"]) {
  return i18n.t(`common:purchaseStatus.${status}`, { defaultValue: status });
}

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
    const label = i18n.t("common:saleItems.coffee");
    return qty > 1 ? `${label} × ${qty}` : label;
  }

  if (sale.sale_type === "water") {
    const label =
      sale.water_bottle_size === "large"
        ? i18n.t("common:saleItems.waterLarge")
        : i18n.t("common:saleItems.waterSmall");
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
  if (sale.sale_type === "coffee") return i18n.t("common:saleItems.coffee");
  if (sale.sale_type === "water") return i18n.t("common:saleItems.water");
  return sale.dish?.name ?? i18n.t("common:emDash");
}

export function formatSaleQuantityUsed(sale: SaleLabelInput & { kilo_consumed?: string | number }) {
  if (sale.sale_type === "water") {
    return i18n.t("common:saleItems.bottlesUsed", { count: sale.quantity ?? 1 });
  }
  return String(sale.kilo_consumed ?? "");
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
