export function formatNumber(value: string | number | null | undefined): string {
  if (value == null || value === "") return "-";
  const n = parseFloat(String(value));
  if (Number.isNaN(n)) return String(value);
  return String(n);
}
