import { useEffect, useState, type FormEvent } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { useAuth } from "../../context/AuthContext";
import { api, type Dish } from "../../services/api";

type WeightType = "quarter" | "half" | "kilo" | "slice";

const WEIGHT_OPTIONS: { value: WeightType; label: string }[] = [
  { value: "quarter", label: "Quarter" },
  { value: "half", label: "Half" },
  { value: "kilo", label: "Kilo" },
  { value: "slice", label: "By Slice" },
];

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "cbe", label: "CBE" },
  { value: "telebirr", label: "Telebirr" },
  { value: "other", label: "Other" },
];

function calcPrice(dish: Dish, weightType: WeightType, qty: number, slices: number) {
  const map: Record<WeightType, number | null> = {
    quarter: dish.price_quarter ? parseFloat(String(dish.price_quarter)) : null,
    half: dish.price_half ? parseFloat(String(dish.price_half)) : null,
    kilo: dish.price_kilo ? parseFloat(String(dish.price_kilo)) : null,
    slice: dish.price_per_slice ? parseFloat(String(dish.price_per_slice)) : null,
  };
  const unit = map[weightType];
  if (unit === null) return 0;
  if (weightType === "slice") return unit * slices * qty;
  return unit * qty;
}

export default function PosPage() {
  const { user } = useAuth();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [form, setForm] = useState({
    dish_id: "",
    weight_type: "kilo" as WeightType,
    quantity: "1",
    slice_count: "1",
    payment_method: "cash",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { submitting, run } = useSubmitLock();

  useEffect(() => {
    api.get<Dish[]>("/dishes?active=true").then(setDishes);
  }, []);

  const selectedDish = dishes.find((d) => d.id === parseInt(form.dish_id));
  const total = selectedDish
    ? calcPrice(
        selectedDish,
        form.weight_type,
        parseInt(form.quantity) || 1,
        parseInt(form.slice_count) || 1
      )
    : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      setError("");
      setSuccess("");
      try {
        await api.post("/sales", {
          dish_id: parseInt(form.dish_id),
          weight_type: form.weight_type,
          quantity: parseInt(form.quantity) || 1,
          slice_count:
            form.weight_type === "slice" ? parseInt(form.slice_count) : undefined,
          payment_method: form.payment_method,
        });
        setSuccess(`Sale recorded by ${user?.name}`);
        setForm({
          dish_id: "",
          weight_type: "kilo",
          quantity: "1",
          slice_count: "1",
          payment_method: "cash",
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div>
      <PageMeta title="POS | Restaurant" description="Point of sale" />
      <PageBreadcrumb pageTitle="Point of Sale" />
      <div className="max-w-lg p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
        <p className="mb-4 text-sm text-gray-500">
          Seller: <strong>{user?.name}</strong> (ID: {user?.short_id})
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-error-500">{error}</p>}
          {success && <p className="text-sm text-success-500">{success}</p>}
          <div>
            <Label>Dish</Label>
            <select
              className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
              value={form.dish_id}
              onChange={(e) => setForm({ ...form, dish_id: e.target.value })}
            >
              <option value="">Select dish</option>
              {dishes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Weight / Portion</Label>
            <div className="grid grid-cols-2 gap-2 mt-1 sm:grid-cols-4">
              {WEIGHT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, weight_type: opt.value })}
                  className={`py-2 text-sm rounded-lg border ${
                    form.weight_type === opt.value
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {form.weight_type === "slice" && (
            <div>
              <Label>Number of Slices</Label>
              <Input
                type="number"
                min="1"
                value={form.slice_count}
                onChange={(e) => setForm({ ...form, slice_count: e.target.value })}
              />
            </div>
          )}
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div>
            <Label>Payment Method</Label>
            <select
              className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            >
              {PAYMENT_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="p-4 text-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <p className="text-sm text-gray-500">Total Price</p>
            <p className="text-2xl font-bold text-brand-600">
              ETB {total.toFixed(2)}
            </p>
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={!form.dish_id || submitting}>
            {submitting ? "Recording..." : "Record Sale"}
          </Button>
        </form>
      </div>
    </div>
  );
}
