import { formatNumber } from "./formatNumber";

export function formatAdjustmentDelta(delta: number, name: string): string | null {
  if (Math.abs(delta) < 0.001) return null;
  const qty = formatNumber(Math.abs(delta));
  if (delta > 0) return `${qty}+ ${name}`;
  return `-${qty} ${name}`;
}

export function buildAdjustmentNote(rows: { delta: number; name: string }[]): string {
  return rows
    .map((row) => formatAdjustmentDelta(row.delta, row.name))
    .filter((part): part is string => part != null)
    .join(", ");
}

export function ingredientDisplayName(
  name: string,
  size: "small" | "large" | null | undefined
): string {
  if (size === "small") return `${name} (Small)`;
  if (size === "large") return `${name} (Large)`;
  return name;
}
