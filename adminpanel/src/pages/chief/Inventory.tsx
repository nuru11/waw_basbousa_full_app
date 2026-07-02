import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import IngredientStockGrid from "../../components/inventory/IngredientStockGrid";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { api, type Ingredient, type WaterSettings } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";
import { translateApiError } from "../../utils/translateApiError";

export default function InventoryPage() {
  const { t } = useTranslation(["chief", "nav", "common"]);
  const [stock, setStock] = useState<Ingredient[]>([]);
  const [waterSettings, setWaterSettings] = useState<WaterSettings | null>(null);
  const [reduceTarget, setReduceTarget] = useState<Ingredient | null>(null);
  const [reduceQty, setReduceQty] = useState("");
  const [reduceNotes, setReduceNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [stockData, water] = await Promise.all([
      api.get<Ingredient[]>("/stock"),
      api.get<WaterSettings>("/water/settings").catch(() => null),
    ]);
    setStock(stockData);
    setWaterSettings(water?.is_active ? water : null);
  };

  useEffect(() => {
    load();
  }, []);

  function openReduce(ingredient: Ingredient) {
    setReduceTarget(ingredient);
    setReduceQty("");
    setReduceNotes("");
    setError("");
  }

  function closeReduce() {
    setReduceTarget(null);
    setReduceQty("");
    setReduceNotes("");
    setError("");
  }

  async function handleReduce(e: FormEvent) {
    e.preventDefault();
    if (!reduceTarget) return;
    const qty = parseFloat(reduceQty);
    if (!qty || qty <= 0) return;

    setSubmitting(true);
    setError("");
    try {
      await api.post("/stock/adjust", {
        ingredient_id: reduceTarget.id,
        quantity_delta: -qty,
        notes: reduceNotes.trim() || undefined,
      });
      closeReduce();
      load();
    } catch (err: unknown) {
      setError(translateApiError(err, "inventory.reduceFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageMeta
        title={t("inventory.metaTitle")}
        description={t("inventory.metaDescription")}
      />
      <PageBreadcrumb pageTitle={t("nav:inventoryRemainingFood")} />

      {waterSettings && (
        <div className="mb-6 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <p className="text-xs font-medium uppercase text-gray-500">{t("inventory.waterTitle")}</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            {t("inventory.waterSmallAvailable", {
              count: formatNumber(waterSettings.available_small_bottles),
            })}
          </p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            {t("inventory.waterLargeAvailable", {
              count: formatNumber(waterSettings.available_large_bottles),
            })}
          </p>
        </div>
      )}

      <IngredientStockGrid
        ingredients={stock}
        lowStockAlert={t("inventory.lowStockAlert")}
        manualReduceLabel={t("inventory.manualReduceOnly")}
        reduceLabel={t("inventory.reduceStock")}
        onReduce={openReduce}
      />

      <Modal isOpen={!!reduceTarget} onClose={closeReduce} className="max-w-md p-6 m-4">
        {reduceTarget && (
          <form onSubmit={handleReduce} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("inventory.reduceStock")}: {reduceTarget.name}
            </h3>
            {error && <p className="text-sm text-error-500">{error}</p>}
            <div>
              <Label>{t("inventory.reduceQuantity")}</Label>
              <Input
                type="number"
                min="0.001"
                step={0.001}
                value={reduceQty}
                onChange={(e) => setReduceQty(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t("common:fields.inStock")}: {reduceTarget.current_stock} {reduceTarget.unit}
              </p>
            </div>
            <div>
              <Label>{t("inventory.reduceNotes")}</Label>
              <Input
                value={reduceNotes}
                onChange={(e) => setReduceNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" size="sm" variant="outline" onClick={closeReduce}>
                {t("common:actions.cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !reduceQty || parseFloat(reduceQty) <= 0}
              >
                {submitting ? t("common:actions.saving") : t("inventory.reduceStock")}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
