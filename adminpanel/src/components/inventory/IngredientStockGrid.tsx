import { useMemo } from "react";
import { StatCard } from "../ui";
import Button from "../ui/button/Button";
import type { Ingredient } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";
import { cn } from "../../utils/cn";

function isLowStock(item: Ingredient): boolean {
  return (
    parseFloat(String(item.current_stock)) <=
    parseFloat(String(item.min_stock || 0))
  );
}

function sortIngredients(ingredients: Ingredient[]): Ingredient[] {
  return [...ingredients].sort((a, b) => {
    const aLow = isLowStock(a);
    const bLow = isLowStock(b);
    if (aLow !== bLow) return aLow ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

interface IngredientStockGridProps {
  ingredients: Ingredient[];
  highlightId?: number;
  lowStockAlert: string;
  manualReduceLabel?: string;
  reduceLabel?: string;
  onReduce?: (ingredient: Ingredient) => void;
}

export default function IngredientStockGrid({
  ingredients,
  highlightId,
  lowStockAlert,
  manualReduceLabel,
  reduceLabel,
  onReduce,
}: IngredientStockGridProps) {
  const sorted = useMemo(() => sortIngredients(ingredients), [ingredients]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((item) => {
        const low = isLowStock(item);
        const highlighted = highlightId === item.id;
        const manual = item.auto_reduce === false;
        return (
          <div key={item.id} className="flex flex-col gap-2">
            <StatCard
              title={item.name}
              value={`${formatNumber(item.current_stock)} ${item.unit}`}
              subtitle={
                low
                  ? lowStockAlert
                  : manual && manualReduceLabel
                    ? manualReduceLabel
                    : undefined
              }
              accent={low ? "error" : highlighted ? "info" : manual ? "warning" : "brand"}
              className={cn(
                highlighted &&
                  "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-900"
              )}
            />
            {manual && onReduce && reduceLabel && (
              <Button type="button" size="sm" variant="outline" onClick={() => onReduce(item)}>
                {reduceLabel}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { isLowStock };
