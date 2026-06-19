import { useEffect, useState, type FormEvent } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { useAuth } from "../../context/AuthContext";
import { api, type Dish, type PlateAvailability, type User } from "../../services/api";
import { ROLE_LABELS } from "../../utils/roleRoutes";
import { formatNumber } from "../../utils/formatNumber";

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

function calcKiloConsumed(weightType: WeightType, qty: number, slices: number) {
  switch (weightType) {
    case "quarter":
      return 0.25 * qty;
    case "half":
      return 0.5 * qty;
    case "kilo":
      return 1.0 * qty;
    case "slice":
      return ((slices / 3) * 0.25) * qty;
    default:
      return 0;
  }
}

interface SalesFormProps {
  compact?: boolean;
}

export default function SalesForm({ compact = false }: SalesFormProps) {
  const { user } = useAuth();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [availability, setAvailability] = useState<PlateAvailability | null>(null);
  const [form, setForm] = useState({
    dish_id: "",
    seller_id: "",
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
    api.get<User[]>("/sales/sellers").then((list) => {
      setSellers(list);
      if (user) {
        setForm((prev) => ({
          ...prev,
          seller_id: prev.seller_id || String(user.id),
        }));
      }
    });
  }, [user]);

  const dishId = parseInt(form.dish_id);
  const selectedDish = dishes.find((d) => d.id === dishId);

  useEffect(() => {
    if (!dishId) {
      setAvailability(null);
      return;
    }
    api
      .get<PlateAvailability>(`/stock/plate-availability/today?dish_id=${dishId}`)
      .then(setAvailability)
      .catch(() => setAvailability(null));
  }, [dishId, success]);

  const qty = parseInt(form.quantity) || 1;
  const slices = parseInt(form.slice_count) || 1;
  const total = selectedDish ? calcPrice(selectedDish, form.weight_type, qty, slices) : 0;
  const kiloNeeded = calcKiloConsumed(form.weight_type, qty, slices);
  const availableKg = availability?.available_kg ?? 0;
  const insufficientStock = dishId > 0 && kiloNeeded > availableKg + 0.0001;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      setError("");
      setSuccess("");
      try {
        await api.post("/sales", {
          dish_id: dishId,
          seller_id: parseInt(form.seller_id),
          weight_type: form.weight_type,
          quantity: qty,
          slice_count: form.weight_type === "slice" ? slices : undefined,
          payment_method: form.payment_method,
        });
        const seller = sellers.find((s) => s.id === parseInt(form.seller_id));
        setSuccess(`Sale recorded for ${seller?.name ?? "seller"}`);
        setForm((prev) => ({
          dish_id: "",
          seller_id: prev.seller_id,
          weight_type: "kilo",
          quantity: "1",
          slice_count: "1",
          payment_method: "cash",
        }));
        setAvailability(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className={compact ? "" : "max-w-lg p-5 rounded-2xl border border-gray-200 dark:border-gray-800"}>
      {!compact && user && (
        <p className="mb-4 text-sm text-gray-500">
          Logged in as <strong>{user.name}</strong> (ID: {user.short_id})
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-error-500">{error}</p>}
        {success && <p className="text-sm text-success-500">{success}</p>}
        <div>
          <Label>Plate</Label>
          <select
            className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
            value={form.dish_id}
            onChange={(e) => setForm({ ...form, dish_id: e.target.value })}
          >
            <option value="">Select plate</option>
            {dishes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        {selectedDish && availability && (
          <div className="p-3 text-sm rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="text-gray-500">Today&apos;s plate stock</p>
            <p className="font-semibold text-brand-600">
              {formatNumber(availability.available_kg)} kg available
            </p>
            <p className="text-xs text-gray-400">
              {availability.produced_plates} plate{availability.produced_plates === 1 ? "" : "s"}{" "}
              cooked today · Produced {formatNumber(availability.produced_kg)} kg · Sold{" "}
              {formatNumber(availability.sold_kg)} kg
            </p>
            {form.weight_type === "slice" && (
              <p className="mt-1 text-xs text-gray-400">
                Stock: every 3 slices = 1 quarter (0.25 kg)
              </p>
            )}
          </div>
        )}
        <div>
          <Label>Seller</Label>
          <select
            className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
            value={form.seller_id}
            onChange={(e) => setForm({ ...form, seller_id: e.target.value })}
          >
            <option value="">Select seller</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({ROLE_LABELS[s.role]}) #{s.short_id}
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
          <p className="text-2xl font-bold text-brand-600">ETB {total.toFixed(2)}</p>
          {dishId > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              Uses {formatNumber(kiloNeeded)} kg from today&apos;s stock
            </p>
          )}
        </div>
        {insufficientStock && (
          <p className="text-sm text-error-500">
            Not enough stock today ({formatNumber(availableKg)} kg available)
          </p>
        )}
        <Button
          type="submit"
          size="sm"
          className="w-full"
          disabled={
            !form.dish_id || !form.seller_id || submitting || insufficientStock
          }
        >
          {submitting ? "Recording..." : "Record Sale"}
        </Button>
      </form>
    </div>
  );
}
