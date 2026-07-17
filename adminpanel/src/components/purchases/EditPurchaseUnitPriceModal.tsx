import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Purchase } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatNumber } from "../../utils/formatNumber";
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
  const [unitPrice, setUnitPrice] = useState("");
  const [error, setError] = useState("");
  const { submitting, run } = useSubmitLock();

  useEffect(() => {
    if (purchase) {
      setUnitPrice(String(purchase.unit_price));
      setError("");
    }
  }, [purchase]);

  const quantity = purchase ? parseFloat(String(purchase.quantity)) : 0;
  const parsedPrice = parseFloat(unitPrice);
  const newTotal =
    Number.isFinite(parsedPrice) && parsedPrice > 0
      ? Math.round(quantity * parsedPrice * 100) / 100
      : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!purchase) return;

    await run(async () => {
      try {
        setError("");
        const price = parseFloat(unitPrice);
        if (!Number.isFinite(price) || price <= 0) {
          setError(t("editPurchase.invalidUnitPrice"));
          return;
        }
        await api.put(`/purchases/${purchase.id}`, { unit_price: price });
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

        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <span className="font-medium text-gray-800 dark:text-white/90">
              {tCommon("fields.ingredient")}:
            </span>{" "}
            {purchase?.ingredient?.name ?? tCommon("emDash")}
          </p>
          <p>
            <span className="font-medium text-gray-800 dark:text-white/90">
              {tCommon("fields.qty")}:
            </span>{" "}
            {formatNumber(quantity)} {purchase?.ingredient?.unit ?? ""}
          </p>
          <p>
            <span className="font-medium text-gray-800 dark:text-white/90">
              {t("editPurchase.currentUnitPrice")}:
            </span>{" "}
            {purchase
              ? formatCurrency(parseFloat(String(purchase.unit_price)))
              : tCommon("emDash")}
          </p>
        </div>

        <div>
          <Label htmlFor="edit-unit-price">{t("editPurchase.newUnitPrice")}</Label>
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
