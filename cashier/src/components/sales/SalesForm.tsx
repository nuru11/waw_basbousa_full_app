import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  type PosDefaultPrices,
  type SaleBatchResponse,
  type TotalPlatePool,
  type User,
} from "../../services/api";
import { paymentMethodLabel, weightTypeLabel } from "../../utils/labels";
import { formatNumber } from "../../utils/formatNumber";
import { formatCurrency } from "../../utils/formatCurrency";
import { translateApiError } from "../../utils/translateApiError";
import {
  paymentColors,
  portionColors,
  sectionAccentClasses,
  sectionTitleClasses,
  // stockBannerClasses,
  // stockStatusColor,
  type SectionAccent,
  type WeightType,
} from "../../utils/posColors";
import { PAYMENT_OPTIONS } from "../../utils/paymentMethods";

type CartLine = {
  id: string;
  dish_id?: number;
  dish_name: string;
  weight_type: WeightType;
  quantity: number;
  slice_count?: number;
  unit_price: number;
  line_total: number;
  kilo_consumed: number;
};

type PriceSource = PosDefaultPrices;

const PRICE_FIELDS: Record<WeightType, keyof PriceSource> = {
  quarter: "price_quarter",
  half: "price_half",
  kilo: "price_kilo",
  slice: "price_per_slice",
};

function parsePositivePrice(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = parseFloat(String(value));
  return n > 0 ? n : null;
}

function normalizePrices(data: unknown): PosDefaultPrices | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const prices: PosDefaultPrices = {
    price_quarter: (row.price_quarter as PosDefaultPrices["price_quarter"]) ?? null,
    price_half: (row.price_half as PosDefaultPrices["price_half"]) ?? null,
    price_kilo: (row.price_kilo as PosDefaultPrices["price_kilo"]) ?? null,
    price_per_slice: (row.price_per_slice as PosDefaultPrices["price_per_slice"]) ?? null,
  };
  const hasAny = Object.values(PRICE_FIELDS).some(
    (field) => parsePositivePrice(prices[field]) != null
  );
  return hasAny ? prices : null;
}

async function loadCashierPrices(): Promise<PosDefaultPrices | null> {
  try {
    const defaults = await api.get<PosDefaultPrices>("/dishes/pos-default-prices");
    const normalized = normalizePrices(defaults);
    if (normalized) return normalized;
  } catch {
    // fall through to dish prices for employee
  }

  try {
    const dishes = await api.get<
      {
        price_quarter: PosDefaultPrices["price_quarter"];
        price_half: PosDefaultPrices["price_half"];
        price_kilo: PosDefaultPrices["price_kilo"];
        price_per_slice: PosDefaultPrices["price_per_slice"];
      }[]
    >("/dishes?active=true");
    for (const dish of dishes) {
      const normalized = normalizePrices(dish);
      if (normalized) return normalized;
    }
  } catch {
    // ignore
  }

  return null;
}

const WEIGHT_OPTIONS: WeightType[] = ["quarter", "half", "kilo", "slice"];

function calcPrice(
  source: PriceSource | null,
  weightType: WeightType,
  qty: number,
  slices: number
) {
  if (!source) return 0;
  const unit = parsePositivePrice(source[PRICE_FIELDS[weightType]]);
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

function totalKiloInCart(cart: CartLine[]) {
  return cart.reduce((sum, line) => sum + line.kilo_consumed, 0);
}

function cartExceedsPoolWarning(cart: CartLine[], pool: TotalPlatePool | undefined) {
  if (!pool) return false;
  return totalKiloInCart(cart) > pool.available_kg + 0.0001;
}

const STOCK_WARNING_CLASSES =
  "p-3 text-sm font-medium border-2 rounded-xl text-pos-amber-800 bg-pos-amber-50 border-pos-amber-200 dark:bg-pos-amber-500/15 dark:border-pos-amber-700 dark:text-pos-amber-300";

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
  const { user, loading: authLoading } = useAuth();
  const [defaultPrices, setDefaultPrices] = useState<PosDefaultPrices | null>(null);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [totalPool, setTotalPool] = useState<TotalPlatePool | undefined>();
  const [sellers, setSellers] = useState<User[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [builder, setBuilder] = useState({
    weight_type: "kilo" as WeightType,
    quantity: "1",
    slice_count: "1",
    manual_kg: "1",
  });
  const [order, setOrder] = useState({
    seller_id: "",
    payment_method: "cash",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { submitting, run } = useSubmitLock();

  const refreshTotalPool = useCallback(async () => {
    try {
      const data = await api.get<TotalPlatePool>("/stock/plate-availability/today/total");
      setTotalPool(data);
    } catch {
      setTotalPool(undefined);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    setPricesLoading(true);
    loadCashierPrices()
      .then(setDefaultPrices)
      .finally(() => setPricesLoading(false));

    api.get<User[]>("/sales/sellers").then((list) => {
      setSellers(list);
      if (user) {
        setOrder((prev) => ({
          ...prev,
          seller_id: prev.seller_id || String(user.id),
        }));
      }
    });
    refreshTotalPool();
  }, [user, authLoading, refreshTotalPool]);

  useEffect(() => {
    refreshTotalPool();
  }, [cart, success, refreshTotalPool]);

  const priceSource = defaultPrices;
  const builderQty = parseInt(builder.quantity) || 1;
  const builderSlices = parseInt(builder.slice_count) || 1;
  const builderLineTotal = priceSource
    ? calcPrice(priceSource, builder.weight_type, builderQty, builderSlices)
    : 0;
  const builderManualKilo = parseFloat(builder.manual_kg) || 0;
  const cartKilo = totalKiloInCart(cart);
  const builderTotalKilo = cartKilo + builderManualKilo;
  const builderInsufficientStock =
    totalPool !== undefined &&
    builderTotalKilo > totalPool.available_kg + 0.0001;
  const missingPortionPrice =
    priceSource != null &&
    parsePositivePrice(priceSource[PRICE_FIELDS[builder.weight_type]]) === null;
  const noPricesConfigured =
    priceSource == null ||
    !Object.values(PRICE_FIELDS).some((field) => parsePositivePrice(priceSource[field]) != null);

  const orderTotal = cart.reduce((sum, line) => sum + line.line_total, 0);
  const cartStockWarning = cartExceedsPoolWarning(cart, totalPool);

  useEffect(() => {
    const qty = parseInt(builder.quantity) || 1;
    const slices = parseInt(builder.slice_count) || 1;
    const kg = calcKiloConsumed(builder.weight_type, qty, slices);
    setBuilder((prev) => ({ ...prev, manual_kg: String(kg) }));
  }, [builder.weight_type, builder.quantity, builder.slice_count]);

  const canAddToCart =
    !pricesLoading &&
    builderLineTotal > 0 &&
    builderManualKilo > 0 &&
    !(builder.weight_type === "slice" && builderSlices < 1);

  const canCompleteOrder =
    cart.length > 0 &&
    !!order.seller_id &&
    !submitting;

  function adjustQuantity(delta: number) {
    setBuilder((prev) => {
      const next = Math.max(1, (parseInt(prev.quantity) || 1) + delta);
      return { ...prev, quantity: String(next) };
    });
  }

  function handleAddToCart() {
    if (!canAddToCart) return;

    const unitPrice =
      builder.weight_type === "slice"
        ? builderLineTotal / (builderSlices * builderQty)
        : builderLineTotal / builderQty;

    const line: CartLine = {
      id: crypto.randomUUID(),
      dish_name: t("sales.generalSale"),
      weight_type: builder.weight_type,
      quantity: builderQty,
      slice_count: builder.weight_type === "slice" ? builderSlices : undefined,
      unit_price: unitPrice,
      line_total: builderLineTotal,
      kilo_consumed: builderManualKilo,
    };

    setCart((prev) => [...prev, line]);
    setBuilder({
      weight_type: "kilo",
      quantity: "1",
      slice_count: "1",
      manual_kg: "1",
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
            ...(line.dish_id != null ? { dish_id: line.dish_id } : {}),
            weight_type: line.weight_type,
            quantity: line.quantity,
            slice_count: line.weight_type === "slice" ? line.slice_count : undefined,
            kilo_consumed: line.kilo_consumed,
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
        refreshTotalPool();
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

      {cartStockWarning && cart.length > 0 && (
        <p className={STOCK_WARNING_CLASSES}>
          {t("cart.stockIssue", {
            amount: formatNumber(totalPool?.available_kg ?? 0),
          })}
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

        {/* {totalPool && (
          <div
            className={`p-4 border-2 rounded-xl ${stockBannerClasses[stockStatusColor(totalPool.available_kg, builderTotalKilo)]}`}
          >
            <p className="text-sm font-medium">{t("sales.totalPlateStock")}</p>
            <p className="mt-1 text-xl font-bold md:text-2xl">
              {t("units.kgAvailable", {
                amount: formatNumber(totalPool.available_kg),
              })}
            </p>
            {cartKilo > 0 && (
              <p className="mt-1 text-xs opacity-80">
                {t("units.kgUsed", {
                  amount: formatNumber(cartKilo),
                })}{" "}
                ({t("cart.title").toLowerCase()})
              </p>
            )}
          </div>
        )} */}

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

        <Section title={t("fields.weightKg")} accent="default">
          <Input
            type="number"
            min="0.001"
            step="0.001"
            value={builder.manual_kg}
            onChange={(e) => setBuilder({ ...builder, manual_kg: e.target.value })}
            className="text-lg font-semibold border-gray-200"
          />
          {/* <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t("sales.manualKgHint")}
          </p> */}
        </Section>

        {builderLineTotal > 0 && (
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
          <p className={STOCK_WARNING_CLASSES}>
            {t("sales.notEnoughStock", {
              amount: formatNumber(totalPool?.available_kg ?? 0),
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
        {!canAddToCart && pricesLoading && (
          <p className="text-xs text-center text-gray-400">{t("loading")}</p>
        )}
        {!canAddToCart && !pricesLoading && noPricesConfigured && (
          <p className="text-xs text-center text-error-500">{t("sales.defaultPriceNotSet")}</p>
        )}
        {!canAddToCart && !pricesLoading && !noPricesConfigured && missingPortionPrice && (
          <p className="text-xs text-center text-error-500">
            {t("sales.portionPriceNotSet", { portion: weightTypeLabel(builder.weight_type) })}
          </p>
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
