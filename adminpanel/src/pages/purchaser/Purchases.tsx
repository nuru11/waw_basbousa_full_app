import { useEffect, useState, type FormEvent } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { api, type Ingredient, type Purchase, type TransferBalance } from "../../services/api";
import PurchaseScreenshot from "../../components/purchases/PurchaseScreenshot";
import { purchaseStatusLabel } from "../../utils/purchaseStatus";
import { useSubmitLock } from "../../hooks/useSubmitLock";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [balance, setBalance] = useState<TransferBalance | null>(null);
  const [form, setForm] = useState({
    ingredient_id: "",
    quantity: "",
    unit_price: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { submitting, run } = useSubmitLock();

  const load = () => {
    api.get<Purchase[]>("/purchases").then(setPurchases);
    api.get<Ingredient[]>("/ingredients").then(setIngredients);
    api.get<TransferBalance>("/transfers/balance").then(setBalance);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!screenshot) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(screenshot);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshot]);

  const total =
    form.quantity && form.unit_price
      ? (parseFloat(form.quantity) * parseFloat(form.unit_price)).toFixed(2)
      : "0.00";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      setError("");
      setSuccess("");
      setWarning("");

      const purchaseTotal = parseFloat(total);
      if (balance && purchaseTotal > balance.total_remaining) {
        setWarning(
          `This purchase exceeds your remaining balance (ETB ${balance.total_remaining.toFixed(2)}). It will still be recorded.`
        );
      }

      if (!screenshot) {
        setError("Screenshot is required");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("ingredient_id", form.ingredient_id);
        formData.append("quantity", form.quantity);
        formData.append("unit_price", form.unit_price);
        formData.append("screenshot", screenshot);

        await api.postForm("/purchases", formData);
        setSuccess("Purchase recorded — added to your inventory");
        setForm({ ingredient_id: "", quantity: "", unit_price: "" });
        setScreenshot(null);
        load();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div>
      <PageMeta title="Purchases | Restaurant" description="Record purchases" />
      <PageBreadcrumb pageTitle="Purchases" />

      {balance && (balance.total_received > 0 || balance.total_pending > 0) && (
        <div className="p-5 mb-6 rounded-2xl border border-gray-200 dark:border-gray-800">
          <h3 className="mb-3 font-semibold">Transfer Balance</h3>
          <div className="flex flex-wrap gap-6 text-sm">
            {balance.total_pending > 0 && (
              <p>
                <span className="text-gray-500">Pending Acceptance:</span>{" "}
                <span className="font-medium text-warning-500">
                  ETB {balance.total_pending.toFixed(2)}
                </span>
              </p>
            )}
            <p>
              <span className="text-gray-500">Total Received:</span>{" "}
              <span className="font-medium">ETB {balance.total_received.toFixed(2)}</span>
            </p>
            <p>
              <span className="text-gray-500">Remaining:</span>{" "}
              <span
                className={`font-medium ${
                  balance.total_remaining < 0 ? "text-error-500" : "text-success-500"
                }`}
              >
                ETB {balance.total_remaining.toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 rounded-2xl border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold">New Purchase / Invoice</h3>
          {error && <p className="text-sm text-error-500">{error}</p>}
          {warning && <p className="text-sm text-warning-500">{warning}</p>}
          {success && <p className="text-sm text-success-500">{success}</p>}
          <div>
            <Label>Ingredient</Label>
            <select
              className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
              value={form.ingredient_id}
              onChange={(e) => setForm({ ...form, ingredient_id: e.target.value })}
            >
              <option value="">Select ingredient</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              step={0.001}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div>
            <Label>Unit Price (ETB)</Label>
            <Input
              type="number"
              step={0.01}
              value={form.unit_price}
              onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
            />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total: ETB {total}
          </p>
          <div>
            <Label>Screenshot (invoice/receipt)</Label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 dark:file:bg-gray-800 dark:file:text-gray-300"
              onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
            />
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Screenshot preview"
                className="mt-2 max-h-32 rounded-lg border border-gray-200 dark:border-gray-700"
              />
            )}
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </form>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 lg:col-span-2 overflow-x-auto">
          <h3 className="mb-4 font-semibold">Purchase History</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3">Ingredient</th>
                <th className="pb-3">Qty</th>
                <th className="pb-3">Unit Price</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Screenshot</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3">{p.ingredient?.name}</td>
                  <td className="py-3">{p.quantity}</td>
                  <td className="py-3">ETB {p.unit_price}</td>
                  <td className="py-3">ETB {p.total_price}</td>
                  <td className="py-3">
                    <span
                      className={
                        p.status === "received"
                          ? "text-success-500"
                          : p.status === "handed"
                            ? "text-brand-500"
                            : "text-warning-500"
                      }
                    >
                      {purchaseStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="py-3">
                    <PurchaseScreenshot
                      purchaseId={p.id}
                      hasScreenshot={!!p.screenshot_path}
                      width={56}
                      height={56}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
