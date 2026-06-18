import { useEffect, useState, type FormEvent } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Dish, type ProductionLog } from "../../services/api";

export default function ProductionPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [form, setForm] = useState({ dish_id: "", plates_count: "", notes: "" });
  const [error, setError] = useState("");
  const { submitting, run } = useSubmitLock();

  const load = () => {
    api.get<Dish[]>("/dishes").then(setDishes);
    api.get<ProductionLog[]>("/stock/production").then(setLogs);
  };

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      setError("");
      try {
        await api.post("/stock/production", {
          dish_id: parseInt(form.dish_id),
          plates_count: parseInt(form.plates_count),
          notes: form.notes || null,
        });
        setForm({ dish_id: "", plates_count: "", notes: "" });
        load();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div>
      <PageMeta title="Production | Restaurant" description="Log production" />
      <PageBreadcrumb pageTitle="Production Log" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 rounded-2xl border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold">Log Plates Made</h3>
          {error && <p className="text-sm text-error-500">{error}</p>}
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
            <Label>Number of Plates</Label>
            <Input
              type="number"
              value={form.plates_count}
              onChange={(e) => setForm({ ...form, plates_count: e.target.value })}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Logging..." : "Log Production (deducts stock)"}
          </Button>
        </form>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
          <h3 className="mb-4 font-semibold">Recent Production</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-2">Dish</th>
                <th className="pb-2">Plates</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2">{log.dish?.name}</td>
                  <td className="py-2">{log.plates_count}</td>
                  <td className="py-2">
                    {new Date(log.logged_at).toLocaleString()}
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
