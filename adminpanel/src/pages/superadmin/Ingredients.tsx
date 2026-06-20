import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Ingredient } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";
import { unitLabel } from "../../utils/purchaseStatus";
import { translateApiError } from "../../utils/translateApiError";

const UNITS = ["bottle", "kg", "piece", "liter", "gram"] as const;

export default function IngredientsPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const { t: tValidation } = useTranslation("validation");
  const [items, setItems] = useState<Ingredient[]>([]);
  const [form, setForm] = useState({ name: "", unit: "kg", min_stock: "0" });
  const [error, setError] = useState("");
  const { submitting, run } = useSubmitLock();

  const load = () =>
    api.get<Ingredient[]>("/ingredients").then(setItems).catch((e) => setError(translateApiError(e)));

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
        setError(translateApiError(err, "common:failed"));
      }
    });
  }

  async function handleDelete(id: number) {
    if (!confirm(tValidation("confirm.deleteIngredient"))) return;
    await api.delete(`/ingredients/${id}`);
    load();
  }

  return (
    <div>
      <PageMeta
        title={t("ingredients.metaTitle")}
        description={t("ingredients.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("ingredients")} />
      {error && <p className="mb-4 text-error-500">{error}</p>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 rounded-2xl border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold">{t("ingredients.addIngredient")}</h3>
          <div>
            <Label>{tCommon("fields.name")}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>{tCommon("fields.unit")}</Label>
            <select
              className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unitLabel(unit)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t("ingredients.minStockAlert")}</Label>
            <Input
              type="number"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
            />
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? tCommon("actions.adding") : tCommon("actions.add")}
          </Button>
        </form>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 lg:col-span-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-gray-500 border-b dark:border-gray-700">
                <th className="pb-3">{tCommon("fields.name")}</th>
                <th className="pb-3">{tCommon("fields.unit")}</th>
                <th className="pb-3">{tCommon("fields.stock")}</th>
                <th className="pb-3">{tCommon("fields.min")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3">{item.name}</td>
                  <td className="py-3">{unitLabel(item.unit)}</td>
                  <td className="py-3">{formatNumber(item.current_stock)}</td>
                  <td className="py-3">{formatNumber(item.min_stock)}</td>
                  <td className="py-3">
                    <button onClick={() => handleDelete(item.id)} className="text-error-500">
                      {tCommon("actions.delete")}
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
