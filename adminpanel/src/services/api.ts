const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && !path.includes('/auth/login')) {
      setToken(null);
      window.location.href = '/signin';
    }
    throw new ApiError(json.message || 'Request failed', res.status);
  }

  return json.data as T;
}

async function requestBlob(path: string): Promise<Blob> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.message || 'Request failed', res.status);
  }
  return res.blob();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  getBlob: (path: string) => requestBlob(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  postForm: <T>(path: string, body: FormData) =>
    request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export interface User {
  id: number;
  name: string;
  username: string;
  phone: string | null;
  role: 'superAdmin' | 'purchaser' | 'chief' | 'employee';
  short_id: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  current_stock: string | number;
  min_stock: string | number;
}

export interface DishIngredient {
  id: number;
  ingredient_id: number;
  quantity_per_plate: string | number;
  ingredient?: Ingredient;
}

export interface Dish {
  id: number;
  name: string;
  plate_weight_grams: string | number | null;
  price_quarter: string | number | null;
  price_half: string | number | null;
  price_kilo: string | number | null;
  price_per_slice: string | number | null;
  is_active: boolean;
  recipe?: DishIngredient[];
}

export interface Purchase {
  id: number;
  ingredient_id: number;
  quantity: string | number;
  unit_price: string | number;
  total_price: string | number;
  status: 'in_inventory' | 'handed' | 'received';
  screenshot_path: string | null;
  handed_at: string | null;
  received_at: string | null;
  ingredient?: Ingredient;
  purchaser?: { id: number; name: string; short_id: string };
  approver?: { id: number; name: string; short_id: string };
  chief?: { id: number; name: string; short_id: string };
}

export interface PurchaserInventorySummary {
  ingredient_id: number;
  ingredient?: Ingredient;
  total_quantity: number;
}

export interface PurchaserInventory {
  summary: PurchaserInventorySummary[];
  purchases: Purchase[];
}

export interface Sale {
  id: number;
  dish_id: number;
  weight_type: 'quarter' | 'half' | 'kilo' | 'slice';
  slice_count: number | null;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
  payment_method: string;
  sold_at: string;
  dish?: Dish;
  employee?: { id: number; name: string; short_id: string };
}

export interface ReportSummary {
  expense: number;
  income: number;
  net_profit: number;
  purchase_count: number;
  sale_count: number;
  pending_purchases: number;
  low_stock: Ingredient[];
  top_dishes: Array<{
    dish_id: number;
    total_revenue: string;
    sale_count: string;
    dish?: { name: string };
  }>;
}

export interface ProductionLog {
  id: number;
  dish_id: number;
  plates_count: number;
  notes: string | null;
  logged_at: string;
  dish?: Dish;
  chief?: { id: number; name: string; short_id: string };
}

export interface Transfer {
  id: number;
  amount: string | number;
  amount_remaining: string | number;
  purchaser_id: number;
  created_by: number;
  status: "pending" | "accepted";
  accepted_at?: string | null;
  created_at?: string;
  createdAt?: string;
  purchaser?: { id: number; name: string; short_id: string };
  creator?: { id: number; name: string; short_id: string };
}

export interface TransferBalance {
  total_received: number;
  total_remaining: number;
  total_pending: number;
}

export interface TransferSummary {
  total_sent: number;
  total_pending: number;
  total_transferred: number;
  total_spent: number;
  total_remaining: number;
  by_purchaser: Array<{
    purchaser_id: number;
    name: string;
    transferred: number;
    pending: number;
    spent: number;
    remaining: number;
  }>;
}
