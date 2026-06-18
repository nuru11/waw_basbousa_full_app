import { useEffect, useState, type FormEvent } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Dish } from "../../services/api";

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [form, setForm] = useState({
    name: "",
    plate_weight_grams: "",
    price_quarter: "",
    price_half: "",
    price_kilo: "",
    price_per_slice: "",
  });
  const [error, setError] = useState("");
  const { submitting, run } = useSubmitLock();

  const load = () => api.get<Dish[]>("/dishes").then(setDishes).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      try {
        await api.post("/dishes", {
          name: form.name,
          plate_weight_grams: form.plate_weight_grams ? parseFloat(form.plate_weight_grams) : null,
          price_quarter: form.price_quarter ? parseFloat(form.price_quarter) : null,
          price_half: form.price_half ? parseFloat(form.price_half) : null,
          price_kilo: form.price_kilo ? parseFloat(form.price_kilo) : null,
          price_per_slice: form.price_per_slice ? parseFloat(form.price_per_slice) : null,
        });
        setForm({
          name: "",
          plate_weight_grams: "",
          price_quarter: "",
          price_half: "",
          price_kilo: "",
          price_per_slice: "",
        });
        load();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  async function toggleActive(dish: Dish) {
    await api.put(`/dishes/${dish.id}`, { is_active: !dish.is_active });
    load();
  }

  return (
    <div>
      <PageMeta title="Dishes | Restaurant" description="Manage dishes" />
      <PageBreadcrumb pageTitle="Dishes / Menu" />
      {error && <p className="mb-4 text-error-500">{error}</p>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-3 rounded-2xl border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold">Add Dish</h3>
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Plate Weight (grams)</Label>
            <Input
              type="number"
              value={form.plate_weight_grams}
              onChange={(e) => setForm({ ...form, plate_weight_grams: e.target.value })}
            />
          </div>
          <div>
            <Label>Price Quarter</Label>
            <Input
              type="number"
              value={form.price_quarter}
              onChange={(e) => setForm({ ...form, price_quarter: e.target.value })}
            />
          </div>
          <div>
            <Label>Price Half</Label>
            <Input
              type="number"
              value={form.price_half}
              onChange={(e) => setForm({ ...form, price_half: e.target.value })}
            />
          </div>
          <div>
            <Label>Price Kilo</Label>
            <Input
              type="number"
              value={form.price_kilo}
              onChange={(e) => setForm({ ...form, price_kilo: e.target.value })}
            />
          </div>
          <div>
            <Label>Price per Slice</Label>
            <Input
              type="number"
              value={form.price_per_slice}
              onChange={(e) => setForm({ ...form, price_per_slice: e.target.value })}
            />
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Adding..." : "Add Dish"}
          </Button>
        </form>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 lg:col-span-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3">Name</th>
                <th className="pb-3">Weight (g)</th>
                <th className="pb-3">¼</th>
                <th className="pb-3">½</th>
                <th className="pb-3">Kilo</th>
                <th className="pb-3">Slice</th>
                <th className="pb-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {dishes.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3">{d.name}</td>
                  <td className="py-3">{d.plate_weight_grams ?? "-"}</td>
                  <td className="py-3">{d.price_quarter ?? "-"}</td>
                  <td className="py-3">{d.price_half ?? "-"}</td>
                  <td className="py-3">{d.price_kilo ?? "-"}</td>
                  <td className="py-3">{d.price_per_slice ?? "-"}</td>
                  <td className="py-3">
                    <button onClick={() => toggleActive(d)} className="text-brand-500">
                      {d.is_active ? "Active" : "Inactive"}
                    </button>
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
