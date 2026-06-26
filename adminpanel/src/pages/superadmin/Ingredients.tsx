import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import { DataTable, SectionCard } from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
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
  const [form, setForm] = useState({ name: "", unit: "kg", min_stock: "0", has_size: false });
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
          has_size: form.has_size,
        });
        setForm({ name: "", unit: "kg", min_stock: "0", has_size: false });
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

  const columns: DataTableColumn<Ingredient>[] = useMemo(
    () => [
      {
        key: "name",
        header: tCommon("fields.name"),
        render: (item) => item.name,
      },
      {
        key: "unit",
        header: tCommon("fields.unit"),
        render: (item) => unitLabel(item.unit),
      },
      {
        key: "has_size",
        header: t("ingredients.hasSizeCol"),
        render: (item) =>
          item.has_size ? t("ingredients.hasSizeYes") : tCommon("emDash"),
      },
      {
        key: "stock",
        header: tCommon("fields.stock"),
        render: (item) => formatNumber(item.current_stock),
      },
      {
        key: "min",
        header: tCommon("fields.min"),
        render: (item) => formatNumber(item.min_stock),
      },
      {
        key: "actions",
        header: "",
        render: (item) => (
          <button
            onClick={() => handleDelete(item.id)}
            className="text-error-500 hover:underline"
          >
            {tCommon("actions.delete")}
          </button>
        ),
      },
    ],
    [t, tCommon]
  );

  return (
    <div>
      <PageMeta
        title={t("ingredients.metaTitle")}
        description={t("ingredients.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("ingredients")} />
      {error && <p className="mb-4 text-error-500">{error}</p>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title={t("ingredients.addIngredient")}>
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{tCommon("fields.name")}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>{tCommon("fields.unit")}</Label>
            <Select
              value={form.unit}
              onChange={(unit) => setForm({ ...form, unit })}
              options={UNITS.map((unit) => ({
                value: unit,
                label: unitLabel(unit),
              }))}
            />
          </div>
          <div>
            <Label>{t("ingredients.minStockAlert")}</Label>
            <Input
              type="number"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
            />
          </div>
          <Checkbox
            label={t("ingredients.hasSize")}
            checked={form.has_size}
            onChange={(has_size) => setForm({ ...form, has_size })}
          />
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? tCommon("actions.adding") : tCommon("actions.add")}
          </Button>
          </form>
        </SectionCard>
        <SectionCard title={tCommon("fields.ingredients")} className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={items}
            keyExtractor={(item) => item.id}
            hoverRows
          />
        </SectionCard>
      </div>
    </div>
  );
}
