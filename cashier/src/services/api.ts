const API_BASE = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  status: number;
  code?: string;
  params?: Record<string, string | number>;

  constructor(
    message: string,
    status: number,
    code?: string,
    params?: Record<string, string | number>
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.params = params;
  }
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && !path.includes("/auth/login")) {
      setToken(null);
      window.location.href = "/signin";
    }
    if (
      res.status === 403 &&
      (json.code === "ACCOUNT_INACTIVE" ||
        String(json.message || "").toLowerCase().includes("inactive"))
    ) {
      setToken(null);
      window.location.href = "/signin";
    }
    throw new ApiError(
      json.message || "Request failed",
      res.status,
      json.code,
      json.params
    );
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};

export interface User {
  id: number;
  name: string;
  username: string;
  phone: string | null;
  role: "superAdmin" | "purchaser" | "chief" | "employee";
  short_id: string;
  status: "active" | "inactive";
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Dish {
  id: number;
  name: string;
  plate_weight_grams: string | number | null;
  price_quarter: string | number | null;
  price_half: string | number | null;
  price_kilo: string | number | null;
  price_per_slice: string | number | null;
  price_half_slice: string | number | null;
  is_active: boolean;
}

export interface PlateAvailability {
  produced_kg: number;
  produced_plates: number;
  sold_kg: number;
  available_kg: number;
}

export interface TotalPlatePool {
  produced_kg: number;
  sold_kg: number;
  available_kg: number;
  remaining_kg: number;
}

export interface PosDefaultPrices {
  price_quarter: string | number | null;
  price_half: string | number | null;
  price_kilo: string | number | null;
  price_per_slice: string | number | null;
  price_half_slice: string | number | null;
}

export interface CoffeeSettings {
  id: number;
  ingredient_id: number | null;
  price_per_cup: string | number | null;
  cups_per_kg: string | number;
  is_active: boolean;
  current_stock_kg: number;
  available_cups: number;
  ingredient?: { id: number; name: string; unit: string; current_stock: string | number } | null;
}

export interface WaterSettings {
  id: number;
  price_per_bottle: string | number | null;
  price_large_bottle: string | number | null;
  is_active: boolean;
  current_stock_small_bottles: number;
  available_small_bottles: number;
  current_stock_large_bottles: number;
  available_large_bottles: number;
  current_stock_bottles: number;
  available_bottles: number;
  min_stock_bottles?: number;
  low_stock?: boolean;
  low_stock_small?: boolean;
  low_stock_large?: boolean;
}

export interface SaleBatchItem {
  sale_type?: "plate" | "coffee" | "water";
  dish_id?: number;
  weight_type?: "quarter" | "half" | "kilo" | "slice" | "half_slice";
  water_bottle_size?: "small" | "large";
  quantity: number;
  slice_count?: number;
  kilo_consumed?: number;
}

export interface SaleBatchRequest {
  seller_id: number;
  payment_method: string;
  tip_amount?: number;
  items: SaleBatchItem[];
}

export interface SaleBatchResponse {
  sales: Sale[];
  order_total: number;
}

export interface Sale {
  id: number;
  dish_id: number | null;
  sale_type?: "plate" | "coffee" | "water";
  seller_id: number;
  weight_type: "quarter" | "half" | "kilo" | "slice" | "half_slice" | null;
  water_bottle_size?: "small" | "large" | null;
  slice_count: number | null;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
  kilo_consumed: string | number;
  payment_method: string;
  tip_amount?: string | number;
  sold_at: string;
  dish?: Dish | null;
  seller?: { id: number; name: string; short_id: string; role?: User["role"] };
}

export interface SaleUpdateRequest {
  weight_type?: Sale["weight_type"];
  quantity?: number;
  slice_count?: number;
  kilo_consumed?: number;
  payment_method?: string;
  tip_amount?: number;
  seller_id?: number;
}
