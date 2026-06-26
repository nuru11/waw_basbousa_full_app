import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import RecipeEditor, {
  emptyRecipeRow,
  parseRecipeRows,
  RecipeParseError,
  recipeRowsFromDish,
  type RecipeRow,
} from "../../components/dishes/RecipeEditor";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import {
  DataTable,
  SectionCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { Modal } from "../../components/ui/modal";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { api, type Dish, type Ingredient } from "../../services/api";
import { formatNumber } from "../../utils/formatNumber";
import { plateWeightToKg } from "../../utils/plateWeight";
import { translateApiError } from "../../utils/translateApiError";

const emptyForm = {
  name: "",
  price_quarter: "",
  price_half: "",
  price_kilo: "",
  price_per_slice: "",
};

function dishToForm(dish: Dish) {
  return {
    name: dish.name,
    price_quarter: dish.price_quarter != null ? String(dish.price_quarter) : "",
    price_half: dish.price_half != null ? String(dish.price_half) : "",
    price_kilo: dish.price_kilo != null ? String(dish.price_kilo) : "",
    price_per_slice: dish.price_per_slice != null ? String(dish.price_per_slice) : "",
  };
}

function recipeSummary(dish: Dish, tCommon: TFunction<"common">) {
  const count = dish.recipe?.length ?? 0;
  if (count === 0) return tCommon("noRecipe");
  const names = dish.recipe!
    .map(
      (r) =>
        r.ingredient?.name ??
        tCommon("ingredientFallback", { id: r.ingredient_id })
    )
    .slice(0, 2)
    .join(", ");
  return count > 2 ? tCommon("recipeMore", { names, count: count - 2 }) : names;
}

export default function DishesPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [createRecipeRows, setCreateRecipeRows] = useState<RecipeRow[]>([emptyRecipeRow()]);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editRecipeRows, setEditRecipeRows] = useState<RecipeRow[]>([]);
  const [error, setError] = useState("");
  const { submitting, run } = useSubmitLock();

  const load = () =>
    api
      .get<Dish[]>("/dishes")
      .then(setDishes)
      .catch((e) => setError(translateApiError(e)));

  useEffect(() => {
    load();
    api.get<Ingredient[]>("/ingredients").then(setIngredients).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      try {
        const recipe = parseRecipeRows(createRecipeRows, ingredients);
        await api.post("/dishes", {
          name: form.name,
          price_quarter: form.price_quarter ? parseFloat(form.price_quarter) : null,
          price_half: form.price_half ? parseFloat(form.price_half) : null,
          price_kilo: form.price_kilo ? parseFloat(form.price_kilo) : null,
          price_per_slice: form.price_per_slice ? parseFloat(form.price_per_slice) : null,
          ...(recipe.length > 0 ? { recipe } : {}),
        });
        setForm(emptyForm);
        setCreateRecipeRows([emptyRecipeRow()]);
        load();
      } catch (err: unknown) {
        if (err instanceof RecipeParseError && err.code === "RECIPE_SIZE_QTY_REQUIRED") {
          setError(tCommon("recipe.sizeQtyRequired"));
          return;
        }
        setError(translateApiError(err, "common:failed"));
      }
    });
  }

  async function toggleActive(dish: Dish) {
    await api.put(`/dishes/${dish.id}`, { is_active: !dish.is_active });
    load();
  }

  function openEditModal(dish: Dish) {
    setEditingDish(dish);
    setEditForm(dishToForm(dish));
    setEditRecipeRows(recipeRowsFromDish(dish.recipe));
  }

  function closeEditModal() {
    setEditingDish(null);
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingDish) return;
    await run(async () => {
      try {
        await api.put(`/dishes/${editingDish.id}`, {
          name: editForm.name,
          price_quarter: editForm.price_quarter ? parseFloat(editForm.price_quarter) : null,
          price_half: editForm.price_half ? parseFloat(editForm.price_half) : null,
          price_kilo: editForm.price_kilo ? parseFloat(editForm.price_kilo) : null,
          price_per_slice: editForm.price_per_slice ? parseFloat(editForm.price_per_slice) : null,
          recipe: parseRecipeRows(editRecipeRows, ingredients),
        });
        closeEditModal();
        load();
      } catch (err: unknown) {
        if (err instanceof RecipeParseError && err.code === "RECIPE_SIZE_QTY_REQUIRED") {
          setError(tCommon("recipe.sizeQtyRequired"));
          return;
        }
        setError(translateApiError(err, "common:recipe.failedToSave"));
      }
    });
  }

  const columns: DataTableColumn<Dish>[] = useMemo(
    () => [
      {
        key: "name",
        header: tCommon("fields.name"),
        render: (d) => d.name,
      },
      {
        key: "weight",
        header: t("dishes.weightKgCol"),
        render: (d) => formatNumber(plateWeightToKg(d.plate_weight_grams)),
      },
      {
        key: "ingredients",
        header: t("dishes.ingredientsCol"),
        render: (d) => (
          <span className="text-gray-600 dark:text-gray-400">
            {recipeSummary(d, tCommon)}
          </span>
        ),
      },
      {
        key: "quarter",
        header: t("dishes.quarterCol"),
        render: (d) => d.price_quarter ?? tCommon("emDash"),
      },
      {
        key: "half",
        header: t("dishes.halfCol"),
        render: (d) => d.price_half ?? tCommon("emDash"),
      },
      {
        key: "kilo",
        header: t("dishes.kiloCol"),
        render: (d) => d.price_kilo ?? tCommon("emDash"),
      },
      {
        key: "slice",
        header: t("dishes.sliceCol"),
        render: (d) => d.price_per_slice ?? tCommon("emDash"),
      },
      {
        key: "active",
        header: t("dishes.activeCol"),
        render: (d) => (
          <button onClick={() => toggleActive(d)} className="hover:underline">
            <StatusBadge variant={d.is_active ? "active" : "rejected"}>
              {d.is_active ? tCommon("status.active") : tCommon("status.inactive")}
            </StatusBadge>
          </button>
        ),
      },
      {
        key: "recipe",
        header: t("dishes.recipeCol"),
        render: (d) => (
          <button
            onClick={() => openEditModal(d)}
            className="text-brand-500 hover:underline"
          >
            {tCommon("actions.edit")}
          </button>
        ),
      },
    ],
    [t, tCommon]
  );

  return (
    <div>
      <PageMeta title={t("dishes.metaTitle")} description={t("dishes.metaDescription")} />
      <PageBreadcrumb pageTitle={tNav("platesMenu")} />
      {error && <p className="mb-4 text-error-500">{error}</p>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title={t("dishes.addPlate")}>
          <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>{tCommon("fields.name")}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>{t("dishes.priceQuarter")}</Label>
            <Input
              type="number"
              value={form.price_quarter}
              onChange={(e) => setForm({ ...form, price_quarter: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("dishes.priceHalf")}</Label>
            <Input
              type="number"
              value={form.price_half}
              onChange={(e) => setForm({ ...form, price_half: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("dishes.priceKilo")}</Label>
            <Input
              type="number"
              value={form.price_kilo}
              onChange={(e) => setForm({ ...form, price_kilo: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("dishes.pricePerSlice")}</Label>
            <Input
              type="number"
              value={form.price_per_slice}
              onChange={(e) => setForm({ ...form, price_per_slice: e.target.value })}
            />
          </div>
          <RecipeEditor
            ingredients={ingredients}
            rows={createRecipeRows}
            onChange={setCreateRecipeRows}
          />
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? tCommon("actions.adding") : t("dishes.addPlate")}
          </Button>
          </form>
        </SectionCard>
        <SectionCard title={tNav("platesMenu")} className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={dishes}
            keyExtractor={(d) => d.id}
            hoverRows
          />
        </SectionCard>
      </div>

      <Modal isOpen={!!editingDish} onClose={closeEditModal} className="max-w-lg p-6 m-4">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <h3 className="text-lg font-semibold">
            {tCommon("recipe.editTitle", { name: editingDish?.name })}
          </h3>
          <div>
            <Label>{tCommon("fields.name")}</Label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("dishes.priceQuarter")}</Label>
            <Input
              type="number"
              value={editForm.price_quarter}
              onChange={(e) => setEditForm({ ...editForm, price_quarter: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("dishes.priceHalf")}</Label>
            <Input
              type="number"
              value={editForm.price_half}
              onChange={(e) => setEditForm({ ...editForm, price_half: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("dishes.priceKilo")}</Label>
            <Input
              type="number"
              value={editForm.price_kilo}
              onChange={(e) => setEditForm({ ...editForm, price_kilo: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("dishes.pricePerSlice")}</Label>
            <Input
              type="number"
              value={editForm.price_per_slice}
              onChange={(e) => setEditForm({ ...editForm, price_per_slice: e.target.value })}
            />
          </div>
          <RecipeEditor
            ingredients={ingredients}
            rows={editRecipeRows}
            onChange={setEditRecipeRows}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? tCommon("actions.saving") : tCommon("actions.save")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={closeEditModal}>
              {tCommon("actions.cancel")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
