import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Label from "../form/Label";
import Select from "../form/Select";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Ingredient, type Purchase } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { unitLabel } from "../../utils/purchaseStatus";
import { translateApiError } from "../../utils/translateApiError";

export default function EditPurchaseUnitPriceModal({
  purchase,
  onClose,
  onSaved,
}: {
  purchase: Purchase | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientId, setIngredientId] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [error, setError] = useState("");
  const { submitting, run } = useSubmitLock();

  useEffect(() => {
    if (!purchase) return;

    setIngredientId(String(purchase.ingredient_id));
    setSize(purchase.size ?? "");
    setQuantity(String(purchase.quantity));
    setUnitPrice(String(purchase.unit_price));
    setError("");

    api
      .get<Ingredient[]>("/ingredients")
      .then(setIngredients)
      .catch((err: unknown) => setError(translateApiError(err)));
  }, [purchase]);

  const selectedIngredient = useMemo(
    () =>
      ingredients.find((item) => String(item.id) === ingredientId) ??
      (purchase?.ingredient && String(purchase.ingredient.id) === ingredientId
        ? purchase.ingredient
        : undefined),
    [ingredients, ingredientId, purchase]
  );
  const requiresSize = selectedIngredient?.has_size ?? false;

  const ingredientOptions = useMemo(() => {
    const options = ingredients.map((item) => ({
      value: String(item.id),
      label: `${item.name} (${unitLabel(item.unit)})`,
    }));
    if (
      purchase?.ingredient &&
      !ingredients.some((item) => item.id === purchase.ingredient_id)
    ) {
      options.unshift({
        value: String(purchase.ingredient.id),
        label: `${purchase.ingredient.name} (${unitLabel(purchase.ingredient.unit)})`,
      });
    }
    return options;
  }, [ingredients, purchase]);

  const parsedQty = parseFloat(quantity);
  const parsedPrice = parseFloat(unitPrice);
  const newTotal =
    Number.isFinite(parsedQty) &&
    parsedQty > 0 &&
    Number.isFinite(parsedPrice) &&
    parsedPrice > 0
      ? Math.round(parsedQty * parsedPrice * 100) / 100
      : null;

  function handleIngredientChange(nextId: string) {
    setIngredientId(nextId);
    const next =
      ingredients.find((item) => String(item.id) === nextId) ??
      (purchase?.ingredient && String(purchase.ingredient.id) === nextId
        ? purchase.ingredient
        : undefined);
    if (!next?.has_size) {
      setSize("");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!purchase) return;

    await run(async () => {
      try {
        setError("");

        if (!ingredientId) {
          setError(t("editPurchase.ingredientRequired"));
          return;
        }

        const qty = parseFloat(quantity);
        if (!Number.isFinite(qty) || qty <= 0) {
          setError(t("editPurchase.invalidQuantity"));
          return;
        }

        const price = parseFloat(unitPrice);
        if (!Number.isFinite(price) || price <= 0) {
          setError(t("editPurchase.invalidUnitPrice"));
          return;
        }

        if (requiresSize && size !== "small" && size !== "large") {
          setError(t("editPurchase.sizeRequired"));
          return;
        }

        await api.put(`/purchases/${purchase.id}`, {
          ingredient_id: Number(ingredientId),
          quantity: qty,
          unit_price: price,
          size: requiresSize ? size : null,
        });
        onSaved();
        onClose();
      } catch (err: unknown) {
        setError(translateApiError(err));
      }
    });
  }

  return (
    <Modal isOpen={!!purchase} onClose={onClose} className="max-w-md p-6 m-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("editPurchase.title", { id: purchase?.id })}
        </h3>

        <div>
          <Label>{tCommon("fields.ingredient")}</Label>
          <Select
            value={ingredientId}
            onChange={handleIngredientChange}
            placeholder={tCommon("fields.selectIngredient")}
            options={ingredientOptions}
          />
        </div>

        {requiresSize && (
          <div>
            <Label>{tCommon("fields.size")}</Label>
            <Select
              value={size}
              onChange={setSize}
              placeholder={tCommon("fields.size")}
              options={[
                { value: "small", label: tCommon("purchaseSizes.small") },
                { value: "large", label: tCommon("purchaseSizes.large") },
              ]}
            />
          </div>
        )}

        <div>
          <Label htmlFor="edit-quantity">
            {tCommon("fields.quantity")}
            {selectedIngredient
              ? ` (${unitLabel(selectedIngredient.unit)})`
              : ""}
          </Label>
          <Input
            id="edit-quantity"
            type="number"
            step={0.001}
            min="0.001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="edit-unit-price">{tCommon("fields.unitPrice")}</Label>
          <Input
            id="edit-unit-price"
            type="number"
            step={0.01}
            min="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-800 dark:text-white/90">
            {t("editPurchase.newTotal")}:
          </span>{" "}
          {newTotal != null ? formatCurrency(newTotal) : tCommon("emDash")}
        </p>

        {error && <p className="text-sm text-error-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            {tCommon("actions.cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? tCommon("actions.saving") : t("editPurchase.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
