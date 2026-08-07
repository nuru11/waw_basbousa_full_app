import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  type CoffeeSettings,
  type WaterSettings,
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
  portionColors,
  sectionAccentClasses,
  sectionTitleClasses,
  // stockBannerClasses,
  // stockStatusColor,
  type SectionAccent,
  type WeightType,
} from "../../utils/posColors";
import { PAYMENT_OPTIONS, type PaymentMethod } from "../../utils/paymentMethods";
import {
  calcKiloConsumed,
  calcPrice,
  DEFAULT_KILO_MANUAL_KG,
  loadCashierPrices,
  parsePositivePrice,
  PRICE_FIELDS,
} from "../../utils/salePricing";

type WaterBottleSize = "small" | "large";

type PaymentRow = {
  id: string;
  method: PaymentMethod;
  amount: string;
};

type CartLine = {
  id: string;
  sale_type?: "plate" | "coffee" | "water";
  dish_id?: number;
  dish_name: string;
  weight_type?: WeightType;
  water_bottle_size?: WaterBottleSize;
  quantity: number;
  slice_count?: number;
  unit_price: number;
  line_total: number;
  kilo_consumed: number;
};

const WEIGHT_OPTIONS: WeightType[] = ["quarter", "half", "kilo", "slice", "half_slice"];
const WATER_SIZE_OPTIONS: WaterBottleSize[] = ["small", "large"];

const waterSizeColors: Record<
  WaterBottleSize,
  { selected: string; idle: string; pill: string }
> = {
  small: {
    selected: "border-sky-600 bg-sky-600 text-white",
    idle:
      "border-sky-200 bg-white text-sky-800 hover:bg-sky-50 dark:border-sky-700 dark:bg-gray-900 dark:text-sky-300",
    pill: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  },
  large: {
    selected: "border-indigo-600 bg-indigo-600 text-white",
    idle:
      "border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-50 dark:border-indigo-700 dark:bg-gray-900 dark:text-indigo-300",
    pill: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300",
  },
};

function waterPriceForSize(settings: WaterSettings, size: WaterBottleSize): number {
  const raw = size === "large" ? settings.price_large_bottle : settings.price_per_bottle;
  return raw ? parseFloat(String(raw)) : 0;
}

function waterSizeHasPrice(settings: WaterSettings, size: WaterBottleSize): boolean {
  return waterPriceForSize(settings, size) > 0;
}

function waterHasAnyPrice(settings: WaterSettings): boolean {
  return WATER_SIZE_OPTIONS.some((size) => waterSizeHasPrice(settings, size));
}

function totalCoffeeCupsInCart(cart: CartLine[]) {
  return cart
    .filter((line) => line.sale_type === "coffee")
    .reduce((sum, line) => sum + line.quantity, 0);
}

function totalWaterBottlesInCart(cart: CartLine[], size?: WaterBottleSize) {
  return cart
    .filter(
      (line) =>
        line.sale_type === "water" &&
        (size == null || (line.water_bottle_size ?? "small") === size)
    )
    .reduce((sum, line) => sum + line.quantity, 0);
}

function waterAvailableForSize(settings: WaterSettings, size: WaterBottleSize): number {
  return size === "large"
    ? settings.available_large_bottles
    : settings.available_small_bottles;
}

function totalKiloInCart(cart: CartLine[]) {
  return cart
    .filter((line) => !line.sale_type || line.sale_type === "plate")
    .reduce((sum, line) => sum + line.kilo_consumed, 0);
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

const PAYMENT_AMOUNT_TOLERANCE = 0.01;

function createPaymentRow(method: PaymentMethod = "cash", amount = ""): PaymentRow {
  return { id: crypto.randomUUID(), method, amount };
}

function formatAmountInput(value: number): string {
  if (value <= 0) return "";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export default function SalesForm() {
  const { t } = useTranslation("common");
  const { user, loading: authLoading } = useAuth();
  const [defaultPrices, setDefaultPrices] = useState<PosDefaultPrices | null>(null);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [totalPool, setTotalPool] = useState<TotalPlatePool | undefined>();
  const [coffeeSettings, setCoffeeSettings] = useState<CoffeeSettings | null>(null);
  const [waterSettings, setWaterSettings] = useState<WaterSettings | null>(null);
  const [sellers, setSellers] = useState<User[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [builder, setBuilder] = useState({
    weight_type: "kilo" as WeightType,
    quantity: "1",
    slice_count: "1",
    manual_kg: DEFAULT_KILO_MANUAL_KG,
  });
  const [coffeeBuilder, setCoffeeBuilder] = useState({ quantity: "1" });
  const [waterBuilder, setWaterBuilder] = useState<{ quantity: string; bottle_size: WaterBottleSize }>({
    quantity: "1",
    bottle_size: "small",
  });
  const [sellerId, setSellerId] = useState("");
  const [payments, setPayments] = useState<PaymentRow[]>([createPaymentRow("cash")]);
  const [tipAmount, setTipAmount] = useState("");
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

  const refreshCoffeeSettings = useCallback(async () => {
    try {
      const data = await api.get<CoffeeSettings>("/coffee/settings");
      setCoffeeSettings(data.is_active ? data : null);
    } catch {
      setCoffeeSettings(null);
    }
  }, []);

  const refreshWaterSettings = useCallback(async () => {
    try {
      const data = await api.get<WaterSettings>("/water/settings");
      setWaterSettings(data.is_active && waterHasAnyPrice(data) ? data : null);
    } catch {
      setWaterSettings(null);
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
        setSellerId((prev) => prev || String(user.id));
      }
    });
    refreshTotalPool();
    refreshCoffeeSettings();
    refreshWaterSettings();
  }, [user, authLoading, refreshTotalPool, refreshCoffeeSettings, refreshWaterSettings]);

  useEffect(() => {
    refreshTotalPool();
    refreshCoffeeSettings();
    refreshWaterSettings();
  }, [cart, success, refreshTotalPool, refreshCoffeeSettings, refreshWaterSettings]);

  const orderTotal = cart.reduce((sum, line) => sum + line.line_total, 0);
  const hasNonCashPayment = payments.some((p) => p.method !== "cash");
  const tipValue = hasNonCashPayment ? parseFloat(tipAmount) || 0 : 0;
  const grandTotal = orderTotal + tipValue;
  const paymentsSum = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const paymentsRemaining = orderTotal - paymentsSum;
  const paymentsMatch =
    orderTotal > 0 && Math.abs(paymentsRemaining) <= PAYMENT_AMOUNT_TOLERANCE;
  const paymentsHavePositiveAmounts = payments.every((p) => (parseFloat(p.amount) || 0) > 0);
  const usedPaymentMethods = new Set(payments.map((p) => p.method));
  const canAddPaymentRow = PAYMENT_OPTIONS.some((method) => !usedPaymentMethods.has(method));

  useEffect(() => {
    if (!hasNonCashPayment && tipAmount !== "") {
      setTipAmount("");
    }
  }, [hasNonCashPayment, tipAmount]);

  useEffect(() => {
    if (payments.length !== 1) return;
    const synced = formatAmountInput(orderTotal);
    setPayments((prev) => {
      if (prev.length !== 1) return prev;
      if (prev[0].amount === synced) return prev;
      return [{ ...prev[0], amount: synced }];
    });
  }, [orderTotal, payments.length]);

  const coffeePrice = coffeeSettings?.price_per_cup
    ? parseFloat(String(coffeeSettings.price_per_cup))
    : 0;
  const coffeeCupsPerKg = coffeeSettings ? parseFloat(String(coffeeSettings.cups_per_kg)) || 100 : 100;
  const coffeeBuilderQty = parseInt(coffeeBuilder.quantity) || 1;
  const coffeeBuilderLineTotal = coffeePrice * coffeeBuilderQty;
  const coffeeBuilderKg = coffeeBuilderQty / coffeeCupsPerKg;
  const cartCoffeeCups = totalCoffeeCupsInCart(cart);
  const builderCoffeeCups = cartCoffeeCups + coffeeBuilderQty;
  const coffeeInsufficientStock =
    coffeeSettings != null &&
    builderCoffeeCups > coffeeSettings.available_cups;

  const waterAvailableSizes = waterSettings
    ? WATER_SIZE_OPTIONS.filter((size) => waterSizeHasPrice(waterSettings, size))
    : [];
  const waterBuilderSize =
    waterSettings && waterSizeHasPrice(waterSettings, waterBuilder.bottle_size)
      ? waterBuilder.bottle_size
      : waterAvailableSizes[0] ?? "small";
  const waterPrice = waterSettings ? waterPriceForSize(waterSettings, waterBuilderSize) : 0;
  const waterBuilderQty = parseInt(waterBuilder.quantity) || 1;
  const waterBuilderLineTotal = waterPrice * waterBuilderQty;
  const cartWaterBottles = totalWaterBottlesInCart(cart, waterBuilderSize);
  const builderWaterBottles = cartWaterBottles + waterBuilderQty;
  const waterInsufficientStock =
    waterSettings != null &&
    builderWaterBottles > waterAvailableForSize(waterSettings, waterBuilderSize);

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

  const canAddCoffeeToCart =
    coffeeSettings != null &&
    coffeePrice > 0 &&
    coffeeBuilderQty > 0 &&
    !coffeeInsufficientStock;

  const canAddWaterToCart =
    waterSettings != null &&
    waterPrice > 0 &&
    waterBuilderQty > 0 &&
    !waterInsufficientStock;

  const canCompleteOrder =
    cart.length > 0 &&
    !!sellerId &&
    paymentsHavePositiveAmounts &&
    paymentsMatch &&
    !submitting;

  function updatePaymentRow(id: string, patch: Partial<Pick<PaymentRow, "method" | "amount">>) {
    setPayments((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (patch.method && prev.some((other) => other.id !== id && other.method === patch.method)) {
          return row;
        }
        return { ...row, ...patch };
      })
    );
  }

  function handleAddPaymentRow() {
    const nextMethod = PAYMENT_OPTIONS.find((method) => !usedPaymentMethods.has(method));
    if (!nextMethod) return;
    const remaining = Math.max(0, orderTotal - paymentsSum);
    setPayments((prev) => [...prev, createPaymentRow(nextMethod, formatAmountInput(remaining))]);
  }

  function handleRemovePaymentRow(id: string) {
    setPayments((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((row) => row.id !== id);
    });
  }

  function adjustQuantity(delta: number) {
    setBuilder((prev) => {
      const next = Math.max(1, (parseInt(prev.quantity) || 1) + delta);
      return { ...prev, quantity: String(next) };
    });
  }

  function adjustCoffeeQuantity(delta: number) {
    setCoffeeBuilder((prev) => {
      const next = Math.max(1, (parseInt(prev.quantity) || 1) + delta);
      return { ...prev, quantity: String(next) };
    });
  }

  function adjustWaterQuantity(delta: number) {
    setWaterBuilder((prev) => {
      const next = Math.max(1, (parseInt(prev.quantity) || 1) + delta);
      return { ...prev, quantity: String(next) };
    });
  }

  function handleAddWaterToCart() {
    if (!canAddWaterToCart || !waterSettings) return;

    const sizeLabel =
      waterBuilderSize === "large" ? t("water.largeBottle") : t("water.smallBottle");
    const line: CartLine = {
      id: crypto.randomUUID(),
      sale_type: "water",
      dish_name: `${t("water.itemName")} (${sizeLabel})`,
      water_bottle_size: waterBuilderSize,
      quantity: waterBuilderQty,
      unit_price: waterPrice,
      line_total: waterBuilderLineTotal,
      kilo_consumed: waterBuilderQty,
    };

    setCart((prev) => [...prev, line]);
    setWaterBuilder({ quantity: "1", bottle_size: waterBuilderSize });
    setError("");
  }

  function handleAddCoffeeToCart() {
    if (!canAddCoffeeToCart || !coffeeSettings) return;

    const line: CartLine = {
      id: crypto.randomUUID(),
      sale_type: "coffee",
      dish_name: t("coffee.itemName"),
      quantity: coffeeBuilderQty,
      unit_price: coffeePrice,
      line_total: coffeeBuilderLineTotal,
      kilo_consumed: coffeeBuilderKg,
    };

    setCart((prev) => [...prev, line]);
    setCoffeeBuilder({ quantity: "1" });
    setError("");
  }

  function handleAddToCart() {
    if (!canAddToCart) return;

    const unitPrice =
      builder.weight_type === "slice"
        ? builderLineTotal / (builderSlices * builderQty)
        : builderLineTotal / builderQty;

    const line: CartLine = {
      id: crypto.randomUUID(),
      sale_type: "plate",
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
      manual_kg: DEFAULT_KILO_MANUAL_KG,
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
          seller_id: parseInt(sellerId),
          payments: payments.map((p) => ({
            payment_method: p.method,
            amount: parseFloat(p.amount) || 0,
          })),
          ...(hasNonCashPayment && tipValue > 0 ? { tip_amount: tipValue } : {}),
          items: cart.map((line) => {
            if (line.sale_type === "coffee") {
              return {
                sale_type: "coffee" as const,
                quantity: line.quantity,
              };
            }
            if (line.sale_type === "water") {
              return {
                sale_type: "water" as const,
                quantity: line.quantity,
                water_bottle_size: line.water_bottle_size ?? "small",
              };
            }
            return {
              sale_type: "plate" as const,
              ...(line.dish_id != null ? { dish_id: line.dish_id } : {}),
              weight_type: line.weight_type!,
              quantity: line.quantity,
              slice_count: line.weight_type === "slice" ? line.slice_count : undefined,
              kilo_consumed: line.kilo_consumed,
            };
          }),
        });

        const seller = sellers.find((s) => s.id === parseInt(sellerId));
        setSuccess(
          t("cart.orderRecorded", {
            count: result.sales.length,
            name: seller?.name ?? t("sales.saleRecordedFallback"),
          })
        );
        setCart([]);
        setPayments([createPaymentRow("cash")]);
        setTipAmount("");
        refreshTotalPool();
        refreshCoffeeSettings();
        refreshWaterSettings();
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
                    {line.sale_type === "coffee" ? (
                      <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-md md:text-sm bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                        {t("coffee.itemName")}
                      </span>
                    ) : line.sale_type === "water" ? (
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-bold rounded-md md:text-sm ${
                          waterSizeColors[line.water_bottle_size ?? "small"].pill
                        }`}
                      >
                        {line.water_bottle_size === "large"
                          ? t("water.largeBottle")
                          : t("water.smallBottle")}
                      </span>
                    ) : (
                      <PortionPill
                        weightType={line.weight_type!}
                        label={weightTypeLabel(line.weight_type!)}
                      />
                    )}
                    <span className="text-xs text-gray-500 md:text-sm">
                      ×{" "}
                      {line.sale_type === "coffee"
                        ? t("coffee.cupsCount", { count: line.quantity })
                        : line.sale_type === "water"
                          ? t("water.bottlesCount", { count: line.quantity })
                          : line.weight_type === "slice"
                          ? `${line.quantity} (${line.slice_count})`
                          : line.quantity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {line.sale_type === "coffee"
                      ? t("coffee.kgUsed", { amount: formatNumber(line.kilo_consumed) })
                      : line.sale_type === "water"
                        ? t("water.bottlesUsed", { count: line.quantity })
                        : t("units.kgUsed", { amount: formatNumber(line.kilo_consumed) })}
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
          value={sellerId}
          onChange={(e) => setSellerId(e.target.value)}
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
        <div className="space-y-3">
          {payments.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-2 p-3 border-2 rounded-xl border-gray-200 dark:border-gray-700 sm:flex-row sm:items-center"
            >
              <select
                className="field-select sm:flex-1"
                value={row.method}
                onChange={(e) =>
                  updatePaymentRow(row.id, { method: e.target.value as PaymentMethod })
                }
              >
                {PAYMENT_OPTIONS.map((method) => {
                  const taken =
                    method !== row.method && usedPaymentMethods.has(method);
                  return (
                    <option key={method} value={method} disabled={taken}>
                      {paymentMethodLabel(method)}
                    </option>
                  );
                })}
              </select>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={row.amount}
                onChange={(e) => updatePaymentRow(row.id, { amount: e.target.value })}
                className="text-lg font-semibold border-gray-200 sm:w-36"
                disabled={payments.length === 1}
              />
              {payments.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemovePaymentRow(row.id)}
                >
                  {t("paymentMethods.removePayment")}
                </Button>
              )}
            </div>
          ))}
        </div>
        {canAddPaymentRow && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleAddPaymentRow}
          >
            {t("paymentMethods.addPayment")}
          </Button>
        )}
        {cart.length > 0 && payments.length > 1 && !paymentsMatch && (
          <p className="mt-2 text-sm font-medium text-error-600 dark:text-error-400">
            {paymentsRemaining > PAYMENT_AMOUNT_TOLERANCE
              ? t("paymentMethods.remaining", {
                  amount: formatCurrency(paymentsRemaining),
                })
              : t("paymentMethods.overpaid", {
                  amount: formatCurrency(Math.abs(paymentsRemaining)),
                })}
          </p>
        )}
      </div>

      {hasNonCashPayment && (
        <div>
          <p className={`mb-2 text-sm font-semibold md:text-base ${sectionTitleClasses.payment}`}>
            {t("fields.tip")}
          </p>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
            className="text-lg font-semibold border-gray-200"
          />
        </div>
      )}

      {cartStockWarning && cart.length > 0 && (
        <p className={STOCK_WARNING_CLASSES}>
          {t("cart.stockIssue", {
            amount: formatNumber(totalPool?.available_kg ?? 0),
          })}
        </p>
      )}

      <div className="hidden p-5 text-center text-white rounded-2xl shadow-theme-sm bg-gradient-to-br from-brand-700 to-brand-500 lg:block">
        {tipValue > 0 && (
          <p className="text-xs font-medium text-white/70 md:text-sm">
            {t("cart.subtotal")}: {formatCurrency(orderTotal)}
          </p>
        )}
        <p className="text-sm font-medium text-white/80 md:text-base">{t("cart.orderTotal")}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
          {formatCurrency(grandTotal)}
        </p>
      </div>
    </div>
  );

  return (
    <form
      onSubmit={handleCompleteOrder}
      className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-6 xl:grid-cols-[1fr_24rem] xl:gap-8 pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-0"
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 md:gap-4">
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

        {coffeeSettings && (
          <>
            <Section title={t("coffee.title")} accent="payment">
              <div className="mb-4 grid gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-500/10 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">{t("coffee.availableCups")}</p>
                  <p className="text-xl font-bold text-amber-800 dark:text-amber-300">
                    {formatNumber(coffeeSettings.available_cups)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">{t("coffee.pricePerCup")}</p>
                  <p className="text-xl font-bold text-amber-800 dark:text-amber-300">
                    {formatCurrency(coffeePrice)}
                  </p>
                </div>
              </div>

              <Section title={t("coffee.cups")} accent="default">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => adjustCoffeeQuantity(-1)}
                    className="flex items-center justify-center w-12 h-12 text-xl font-bold bg-white border-2 rounded-xl touch-target border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 md:w-14 md:h-14"
                    aria-label="Decrease cups"
                  >
                    −
                  </button>
                  <Input
                    type="number"
                    min="1"
                    value={coffeeBuilder.quantity}
                    onChange={(e) => setCoffeeBuilder({ quantity: e.target.value })}
                    className="text-center text-lg font-bold border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => adjustCoffeeQuantity(1)}
                    className="flex items-center justify-center w-12 h-12 text-xl font-bold bg-white border-2 rounded-xl touch-target border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 md:w-14 md:h-14"
                    aria-label="Increase cups"
                  >
                    +
                  </button>
                </div>
              </Section>

              {coffeeBuilderLineTotal > 0 && (
                <div className="p-4 mt-4 text-center border rounded-xl bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("sales.totalPrice")}
                  </p>
                  <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                    {formatCurrency(coffeeBuilderLineTotal)}
                  </p>
                </div>
              )}

              {coffeeInsufficientStock && (
                <p className={`mt-3 ${STOCK_WARNING_CLASSES}`}>
                  {t("coffee.notEnoughStock", {
                    count: coffeeSettings.available_cups,
                  })}
                </p>
              )}

              <Button
                type="button"
                size="lg"
                variant="primary"
                className="w-full mt-4"
                disabled={!canAddCoffeeToCart}
                onClick={handleAddCoffeeToCart}
              >
                {t("coffee.addToOrder")}
              </Button>
            </Section>
          </>
        )}

        {waterSettings && (
          <>
            <Section title={t("water.title")} accent="portion">
              <div className="mb-4 grid gap-3 rounded-xl border border-sky-200 bg-sky-50/50 p-4 dark:border-sky-800 dark:bg-sky-500/10 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    {t("water.availableBottles")}
                  </p>
                  <p className="text-xl font-bold text-sky-800 dark:text-sky-300">
                    {formatNumber(waterAvailableForSize(waterSettings, waterBuilderSize))}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    {t("water.selectedPrice")}
                  </p>
                  <p className="text-xl font-bold text-sky-800 dark:text-sky-300">
                    {formatCurrency(waterPrice)}
                  </p>
                </div>
              </div>

              <Section title={t("water.bottleSize")} accent="default">
                <div className="grid grid-cols-2 gap-3">
                  {waterAvailableSizes.map((size) => (
                    <ChoiceButton
                      key={size}
                      selected={waterBuilderSize === size}
                      onClick={() => setWaterBuilder((prev) => ({ ...prev, bottle_size: size }))}
                      colorClass={waterSizeColors[size]}
                    >
                      <span className="block">{size === "large" ? t("water.largeBottle") : t("water.smallBottle")}</span>
                      <span className="mt-1 block text-xs font-normal opacity-90">
                        {formatCurrency(waterPriceForSize(waterSettings, size))}
                      </span>
                    </ChoiceButton>
                  ))}
                </div>
              </Section>

              <Section title={t("water.bottles")} accent="default">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => adjustWaterQuantity(-1)}
                    className="flex items-center justify-center w-12 h-12 text-xl font-bold bg-white border-2 rounded-xl touch-target border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 md:w-14 md:h-14"
                    aria-label="Decrease bottles"
                  >
                    −
                  </button>
                  <Input
                    type="number"
                    min="1"
                    value={waterBuilder.quantity}
                    onChange={(e) => setWaterBuilder((prev) => ({ ...prev, quantity: e.target.value }))}
                    className="text-center text-lg font-bold border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => adjustWaterQuantity(1)}
                    className="flex items-center justify-center w-12 h-12 text-xl font-bold bg-white border-2 rounded-xl touch-target border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 md:w-14 md:h-14"
                    aria-label="Increase bottles"
                  >
                    +
                  </button>
                </div>
              </Section>

              {waterBuilderLineTotal > 0 && (
                <div className="p-4 mt-4 text-center border rounded-xl bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("sales.totalPrice")}
                  </p>
                  <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                    {formatCurrency(waterBuilderLineTotal)}
                  </p>
                </div>
              )}

              {waterInsufficientStock && (
                <p className={`mt-3 ${STOCK_WARNING_CLASSES}`}>
                  {t("water.notEnoughStock", {
                    count: waterAvailableForSize(waterSettings, waterBuilderSize),
                  })}
                </p>
              )}

              <Button
                type="button"
                size="lg"
                variant="primary"
                className="w-full mt-4"
                disabled={!canAddWaterToCart}
                onClick={handleAddWaterToCart}
              >
                {t("water.addToOrder")}
              </Button>
            </Section>
          </>
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-4 pb-[calc(3.5rem+env(safe-area-inset-bottom))] backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 lg:hidden">
        <div className="flex items-center gap-3 mx-auto max-w-6xl">
          <div className="flex-1 min-w-0">
            {tipValue > 0 && (
              <p className="text-xs text-gray-400">
                {t("cart.subtotal")}: {formatCurrency(orderTotal)}
              </p>
            )}
            <p className="text-xs font-medium text-gray-500">{t("cart.orderTotal")}</p>
            <p className="text-2xl font-bold truncate text-brand-600 dark:text-brand-400">
              {formatCurrency(grandTotal)}
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
