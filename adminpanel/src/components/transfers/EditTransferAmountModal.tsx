import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Transfer } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { translateApiError } from "../../utils/translateApiError";

export default function EditTransferAmountModal({
  transfer,
  onClose,
  onSaved,
}: {
  transfer: Transfer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const { submitting, run } = useSubmitLock();

  useEffect(() => {
    if (transfer) {
      setAmount(String(transfer.amount));
      setError("");
    }
  }, [transfer]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!transfer) return;

    await run(async () => {
      try {
        setError("");
        const parsed = parseFloat(amount);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          setError(t("editTransfer.invalidAmount"));
          return;
        }
        await api.put(`/transfers/${transfer.id}`, { amount: parsed });
        onSaved();
        onClose();
      } catch (err: unknown) {
        setError(translateApiError(err));
      }
    });
  }

  return (
    <Modal isOpen={!!transfer} onClose={onClose} className="max-w-md p-6 m-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("editTransfer.title", { id: transfer?.id })}
        </h3>

        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <span className="font-medium text-gray-800 dark:text-white/90">
              {tCommon("fields.purchaser")}:
            </span>{" "}
            {transfer?.purchaser?.name ?? tCommon("emDash")}
          </p>
          <p>
            <span className="font-medium text-gray-800 dark:text-white/90">
              {t("editTransfer.currentAmount")}:
            </span>{" "}
            {transfer
              ? formatCurrency(parseFloat(String(transfer.amount)))
              : tCommon("emDash")}
          </p>
        </div>

        <div>
          <Label htmlFor="edit-transfer-amount">{t("editTransfer.newAmount")}</Label>
          <Input
            id="edit-transfer-amount"
            type="number"
            step={0.01}
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-error-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            {tCommon("actions.cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? tCommon("actions.saving") : t("editTransfer.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
