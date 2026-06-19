import { useEffect, useState, type FormEvent } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Ingredient } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";

export default function IngredientsPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [form, setForm] = useState({ name: "", unit: "kg", min_stock: "0" });
  const [error, setError] = useState("");
  const { submitting, run } = useSubmitLock();

  const load = () =>
    api.get<Ingredient[]>("/ingredients").then(setItems).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      try {
        await api.post("/ingredients", {
          name: form.name,
          unit: form.unit,
          min_stock: parseFloat(form.min_stock),
        });
        setForm({ name: "", unit: "kg", min_stock: "0" });
        load();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete ingredient?")) return;
    await api.delete(`/ingredients/${id}`);
    load();
  }

  return (
    <div>
      <PageMeta title="Ingredients | Restaurant" description="Manage ingredients" />
      <PageBreadcrumb pageTitle="Ingredients" />
      {error && <p className="mb-4 text-error-500">{error}</p>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 rounded-2xl border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold">Add Ingredient</h3>
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Unit</Label>
            <select
              className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              <option value="bottle">Bottle</option>
              <option value="kg">Kilogram</option>
              <option value="piece">Piece</option>
              <option value="liter">Liter</option>
              <option value="gram">Gram</option>
            </select>
          </div>
          <div>
            <Label>Min Stock Alert</Label>
            <Input
              type="number"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
            />
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Adding..." : "Add"}
          </Button>
        </form>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 lg:col-span-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3">Name</th>
                <th className="pb-3">Unit</th>
                <th className="pb-3">Stock</th>
                <th className="pb-3">Min</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3">{item.name}</td>
                  <td className="py-3">{item.unit}</td>
                  <td className="py-3">{formatNumber(item.current_stock)}</td>
                  <td className="py-3">{formatNumber(item.min_stock)}</td>
                  <td className="py-3">
                    <button onClick={() => handleDelete(item.id)} className="text-error-500">
                      Delete
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
