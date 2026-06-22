import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  type Dish,
  type PlateAvailability,
  type SaleBatchResponse,
  type User,
} from "../../services/api";
import { paymentMethodLabel, weightTypeLabel } from "../../utils/labels";
import { formatNumber } from "../../utils/formatNumber";
import { formatCurrency } from "../../utils/formatCurrency";
import { translateApiError } from "../../utils/translateApiError";
import {
  foodChoiceColors,
  paymentColors,
  portionColors,
  sectionAccentClasses,
  sectionTitleClasses,
  stockBannerClasses,
  stockStatusColor,
  type SectionAccent,
  type WeightType,
} from "../../utils/posColors";
import { PAYMENT_OPTIONS } from "../../utils/paymentMethods";
import { DEFAULT_DISH_IMAGE, dishImageUrl } from "../../utils/dishImage";

type CartLine = {
  id: string;
  dish_id: number;
  dish_name: string;
  weight_type: WeightType;
  quantity: number;
  slice_count?: number;
  unit_price: number;
  line_total: number;
  kilo_consumed: number;
};

const WEIGHT_OPTIONS: WeightType[] = ["quarter", "half", "kilo", "slice"];

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

function kiloInCart(cart: CartLine[], dishId: number) {
  return cart
    .filter((line) => line.dish_id === dishId)
    .reduce((sum, line) => sum + line.kilo_consumed, 0);
}

function aggregateKiloByDish(cart: CartLine[]) {
  const map = new Map<number, number>();
  for (const line of cart) {
    map.set(line.dish_id, (map.get(line.dish_id) || 0) + line.kilo_consumed);
  }
  return map;
}

function cartHasStockIssues(
  cart: CartLine[],
  availabilityByDish: Record<number, PlateAvailability | undefined>
) {
  const kiloByDish = aggregateKiloByDish(cart);
  for (const [dishId, kilo] of kiloByDish) {
    const available = availabilityByDish[dishId]?.available_kg ?? 0;
    if (kilo > available + 0.0001) return true;
  }
  return false;
}

function Section({
  title,
  accent = "default",
  children,
}: {
  title: string;
  accent?: SectionAccent;
  children: ReactNode;
}) {
  return (
    <section className={sectionAccentClasses[accent]}>
      <h2
        className={`mb-4 text-sm font-bold tracking-wide uppercase md:text-base ${sectionTitleClasses[accent]}`}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
  colorClass,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  colorClass: { selected: string; idle: string };
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`touch-target rounded-xl border-2 px-3 py-3 text-sm font-semibold transition touch-manipulation md:py-4 md:text-base ${
        selected ? colorClass.selected : colorClass.idle
      } ${className}`}
    >
      {children}
    </button>
  );
}

function PlateChoiceButton({
  dish,
  selected,
  onClick,
}: {
  dish: Dish;
  selected: boolean;
  onClick: () => void;
}) {
  const [imgSrc, setImgSrc] = useState(() => dishImageUrl(dish.name));

  useEffect(() => {
    setImgSrc(dishImageUrl(dish.name));
  }, [dish.name]);

  function handleImageError() {
    setImgSrc((current) => (current === DEFAULT_DISH_IMAGE ? current : DEFAULT_DISH_IMAGE));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full flex-col overflow-hidden rounded-xl border-2 text-left transition touch-manipulation ${
        selected ? foodChoiceColors.selected : foodChoiceColors.idle
      }`}
    >
      <div className="relative h-28 w-full shrink-0 overflow-hidden bg-white/60 dark:bg-gray-900/40 md:h-32">
        <img
          src={imgSrc}
          alt={dish.name}
          className="absolute inset-0 h-full w-full object-cover object-center"
          onError={handleImageError}
          loading="lazy"
        />
      </div>
      <span className="flex min-h-[2.75rem] flex-1 items-center px-3 py-2.5 text-sm font-semibold leading-snug line-clamp-2 md:min-h-[3rem] md:py-3 md:text-base">
        {dish.name}
      </span>
    </button>
  );
}

function PortionPill({ weightType, label }: { weightType: WeightType; label: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-bold rounded-md md:text-sm ${portionColors[weightType].pill}`}
    >
      {label}
    </span>
  );
}

export default function SalesForm() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [availabilityByDish, setAvailabilityByDish] = useState<
    Record<number, PlateAvailability>
  >({});
  const [builder, setBuilder] = useState({
    dish_id: "",
    weight_type: "kilo" as WeightType,
    quantity: "1",
    slice_count: "1",
  });
  const [order, setOrder] = useState({
    seller_id: "",
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
        setOrder((prev) => ({
          ...prev,
          seller_id: prev.seller_id || String(user.id),
        }));
      }
    });
  }, [user]);

  const dishId = parseInt(builder.dish_id);
  const selectedDish = dishes.find((d) => d.id === dishId);
  const builderQty = parseInt(builder.quantity) || 1;
  const builderSlices = parseInt(builder.slice_count) || 1;
  const builderLineTotal = selectedDish
    ? calcPrice(selectedDish, builder.weight_type, builderQty, builderSlices)
    : 0;
  const builderKilo = calcKiloConsumed(builder.weight_type, builderQty, builderSlices);
  const builderAvailability = dishId > 0 ? availabilityByDish[dishId] : undefined;
  const builderKiloInCart = dishId > 0 ? kiloInCart(cart, dishId) : 0;
  const builderTotalKilo = builderKiloInCart + builderKilo;
  const builderInsufficientStock =
    dishId > 0 &&
    builderAvailability !== undefined &&
    builderTotalKilo > builderAvailability.available_kg + 0.0001;

  const orderTotal = cart.reduce((sum, line) => sum + line.line_total, 0);
  const cartStockIssue = cartHasStockIssues(cart, availabilityByDish);

  const refreshAvailability = useCallback(async (dishIds: number[]) => {
    const unique = [...new Set(dishIds.filter((id) => id > 0))];
    if (unique.length === 0) return;

    const results = await Promise.all(
      unique.map((id) =>
        api
          .get<PlateAvailability>(`/stock/plate-availability/today?dish_id=${id}`)
          .then((data) => ({ id, data }))
          .catch(() => null)
      )
    );

    setAvailabilityByDish((prev) => {
      const next = { ...prev };
      for (const result of results) {
        if (result) next[result.id] = result.data;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!dishId) return;
    refreshAvailability([dishId]);
  }, [dishId, refreshAvailability]);

  useEffect(() => {
    const ids = cart.map((line) => line.dish_id);
    if (dishId) ids.push(dishId);
    refreshAvailability(ids);
  }, [cart, dishId, refreshAvailability, success]);

  const canAddToCart =
    !!selectedDish &&
    builderLineTotal > 0 &&
    !builderInsufficientStock &&
    !(builder.weight_type === "slice" && builderSlices < 1);

  const canCompleteOrder =
    cart.length > 0 &&
    !!order.seller_id &&
    !cartStockIssue &&
    !submitting;

  function adjustQuantity(delta: number) {
    setBuilder((prev) => {
      const next = Math.max(1, (parseInt(prev.quantity) || 1) + delta);
      return { ...prev, quantity: String(next) };
    });
  }

  function handleAddToCart() {
    if (!selectedDish || !canAddToCart) return;

    const unitPrice =
      builder.weight_type === "slice"
        ? builderLineTotal / (builderSlices * builderQty)
        : builderLineTotal / builderQty;

    const line: CartLine = {
      id: crypto.randomUUID(),
      dish_id: selectedDish.id,
      dish_name: selectedDish.name,
      weight_type: builder.weight_type,
      quantity: builderQty,
      slice_count: builder.weight_type === "slice" ? builderSlices : undefined,
      unit_price: unitPrice,
      line_total: builderLineTotal,
      kilo_consumed: builderKilo,
    };

    setCart((prev) => [...prev, line]);
    setBuilder({
      dish_id: "",
      weight_type: "kilo",
      quantity: "1",
      slice_count: "1",
    });
    setError("");
  }

  function handleRemoveLine(lineId: string) {
    setCart((prev) => prev.filter((line) => line.id !== lineId));
  }

  async function handleCompleteOrder(e: FormEvent) {
    e.preventDefault();
    if (!canCompleteOrder) return;

    await run(async () => {
      setError("");
      setSuccess("");
      try {
        const result = await api.post<SaleBatchResponse>("/sales/batch", {
          seller_id: parseInt(order.seller_id),
          payment_method: order.payment_method,
          items: cart.map((line) => ({
            dish_id: line.dish_id,
            weight_type: line.weight_type,
            quantity: line.quantity,
            slice_count: line.weight_type === "slice" ? line.slice_count : undefined,
          })),
        });

        const seller = sellers.find((s) => s.id === parseInt(order.seller_id));
        setSuccess(
          t("cart.orderRecorded", {
            count: result.sales.length,
            name: seller?.name ?? t("sales.saleRecordedFallback"),
          })
        );
        setCart([]);
      } catch (err: unknown) {
        setError(translateApiError(err));
      }
    });
  }

  const summaryBlock = (
    <div className="space-y-4">
      <div className="pos-section-cart">
        <h3 className={`mb-3 text-sm font-bold uppercase md:text-base ${sectionTitleClasses.cart}`}>
          {t("cart.title")}
        </h3>
        {cart.length === 0 ? (
          <p className="text-sm text-gray-500 md:text-base">{t("cart.empty")}</p>
        ) : (
          <ul className="space-y-2">
            {cart.map((line) => (
              <li
                key={line.id}
                className="flex items-start justify-between gap-3 p-3 bg-white border rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 dark:text-white/90">
                    {line.dish_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <PortionPill
                      weightType={line.weight_type}
                      label={weightTypeLabel(line.weight_type)}
                    />
                    <span className="text-xs text-gray-500 md:text-sm">
                      ×{" "}
                      {line.weight_type === "slice"
                        ? `${line.quantity} (${line.slice_count})`
                        : line.quantity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {t("units.kgUsed", { amount: formatNumber(line.kilo_consumed) })}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className="font-bold text-brand-600 dark:text-brand-400">
                    {formatCurrency(line.line_total)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(line.id)}
                    className="mt-1 text-xs font-medium text-gray-500 touch-target dark:text-gray-400"
                  >
                    {t("cart.removeItem")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {cart.length > 0 && (
          <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("cart.itemCount", { count: cart.length })}
          </p>
        )}
      </div>

      <div>
        <p className={`mb-2 text-sm font-semibold md:text-base ${sectionTitleClasses.plate}`}>
          {t("fields.seller")}
        </p>
        <select
          className="field-select"
          value={order.seller_id}
          onChange={(e) => setOrder({ ...order, seller_id: e.target.value })}
        >
          <option value="">{t("fields.selectSeller")}</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} #{s.short_id}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className={`mb-2 text-sm font-semibold md:text-base ${sectionTitleClasses.payment}`}>
          {t("paymentMethods.method")}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PAYMENT_OPTIONS.map((p) => (
            <ChoiceButton
              key={p}
              selected={order.payment_method === p}
              onClick={() => setOrder({ ...order, payment_method: p })}
              colorClass={paymentColors[p]}
              className="min-h-[3.5rem]"
            >
              {paymentMethodLabel(p)}
            </ChoiceButton>
          ))}
        </div>
      </div>

      {cartStockIssue && cart.length > 0 && (
        <p className="p-3 text-sm font-medium border-2 rounded-xl text-error-600 bg-error-50 border-error-200 dark:bg-error-500/10">
          {t("cart.stockIssue")}
        </p>
      )}

      <div className="hidden p-5 text-center text-white rounded-2xl shadow-theme-sm bg-gradient-to-br from-brand-700 to-brand-500 lg:block">
        <p className="text-sm font-medium text-white/80 md:text-base">{t("cart.orderTotal")}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
          {formatCurrency(orderTotal)}
        </p>
      </div>
    </div>
  );

  return (
    <form
      onSubmit={handleCompleteOrder}
      className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-6 xl:grid-cols-[1fr_24rem] xl:gap-8 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-0"
    >
      <div className="space-y-4 md:space-y-5">
        {(error || success) && (
          <div
            className={`rounded-xl p-4 text-sm font-medium md:text-base ${
              error
                ? "bg-error-50 text-error-600 dark:bg-error-500/10"
                : "bg-success-50 text-success-600 dark:bg-success-500/10"
            }`}
          >
            {error || success}
          </div>
        )}

        <Section title={t("fields.plate")} accent="plate">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 auto-rows-fr">
            {dishes.map((d) => (
              <PlateChoiceButton
                key={d.id}
                dish={d}
                selected={builder.dish_id === String(d.id)}
                onClick={() => setBuilder({ ...builder, dish_id: String(d.id) })}
              />
            ))}
          </div>
          {dishes.length === 0 && (
            <p className="text-sm text-gray-500">{t("loading")}</p>
          )}
        </Section>

        {selectedDish && builderAvailability && (
          <div
            className={`p-4 border-2 rounded-xl ${stockBannerClasses[stockStatusColor(builderAvailability.available_kg, builderTotalKilo)]}`}
          >
            <p className="text-sm font-medium">{t("sales.todaysPlateStock")}</p>
            <p className="mt-1 text-xl font-bold md:text-2xl">
              {t("units.kgAvailable", {
                amount: formatNumber(builderAvailability.available_kg),
              })}
            </p>
            {builderKiloInCart > 0 && (
              <p className="mt-1 text-xs opacity-80">
                {t("units.kgUsed", {
                  amount: formatNumber(builderKiloInCart),
                })}{" "}
                ({t("cart.title").toLowerCase()})
              </p>
            )}
          </div>
        )}

        <Section title={t("sales.weightPortion")} accent="portion">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {WEIGHT_OPTIONS.map((opt) => (
              <ChoiceButton
                key={opt}
                selected={builder.weight_type === opt}
                onClick={() => setBuilder({ ...builder, weight_type: opt })}
                colorClass={portionColors[opt]}
              >
                {weightTypeLabel(opt)}
              </ChoiceButton>
            ))}
          </div>
        </Section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Section title={t("fields.quantity")} accent="default">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustQuantity(-1)}
                className="flex items-center justify-center w-12 h-12 text-xl font-bold bg-white border-2 rounded-xl touch-target border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 md:w-14 md:h-14"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <Input
                type="number"
                min="1"
                value={builder.quantity}
                onChange={(e) => setBuilder({ ...builder, quantity: e.target.value })}
                className="text-center text-lg font-bold border-gray-200"
              />
              <button
                type="button"
                onClick={() => adjustQuantity(1)}
                className="flex items-center justify-center w-12 h-12 text-xl font-bold bg-white border-2 rounded-xl touch-target border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 md:w-14 md:h-14"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </Section>

          {builder.weight_type === "slice" && (
            <Section title={t("weightTypes.sliceCount")} accent="default">
              <Input
                type="number"
                min="1"
                value={builder.slice_count}
                onChange={(e) => setBuilder({ ...builder, slice_count: e.target.value })}
                className="text-lg font-semibold border-gray-200"
              />
            </Section>
          )}
        </div>

        {selectedDish && (
          <div className="p-4 text-center border rounded-xl bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("sales.totalPrice")}
            </p>
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {formatCurrency(builderLineTotal)}
            </p>
          </div>
        )}

        {builderInsufficientStock && (
          <p className="p-3 text-sm font-medium border-2 rounded-xl text-error-600 bg-error-50 border-error-200">
            {t("sales.notEnoughStock", {
              amount: formatNumber(builderAvailability?.available_kg ?? 0),
            })}
          </p>
        )}

        <Button
          type="button"
          size="lg"
          variant="primary"
          className="w-full"
          disabled={!canAddToCart}
          onClick={handleAddToCart}
        >
          {t("cart.addToOrder")}
        </Button>
        {!builder.dish_id && (
          <p className="text-xs text-center text-gray-400">{t("cart.selectPlateFirst")}</p>
        )}
      </div>

      <aside className="hidden mt-0 lg:block lg:sticky lg:top-24 lg:self-start">
        <div className="pos-section-cart">{summaryBlock}</div>
        <Button
          type="submit"
          size="lg"
          variant="success"
          className="w-full mt-4"
          disabled={!canCompleteOrder}
        >
          {submitting ? t("cart.completing") : t("cart.completeOrder")}
        </Button>
      </aside>

      {/* Mobile / portrait tablet order panel */}
      <div className="mt-4 lg:hidden">
        <div className="pos-section-cart">{summaryBlock}</div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 lg:hidden">
        <div className="flex items-center gap-3 mx-auto max-w-6xl">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500">{t("cart.orderTotal")}</p>
            <p className="text-2xl font-bold truncate text-brand-600 dark:text-brand-400">
              {formatCurrency(orderTotal)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("cart.itemCount", { count: cart.length })}
            </p>
          </div>
          <Button
            type="submit"
            size="lg"
            variant="success"
            className="shrink-0 min-w-[9rem] px-6"
            disabled={!canCompleteOrder}
          >
            {submitting ? t("cart.completing") : t("cart.completeOrder")}
          </Button>
        </div>
      </div>
    </form>
  );
}
