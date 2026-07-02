const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  code?: string;
  params?: Record<string, string | number>;

  constructor(message: string, status: number, code?: string, params?: Record<string, string | number>) {
    super(message);
    this.status = status;
    this.code = code;
    this.params = params;
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
    if (
      res.status === 403 &&
      (json.code === "ACCOUNT_INACTIVE" ||
        String(json.message || "").toLowerCase().includes("inactive"))
    ) {
      setToken(null);
      window.location.href = '/signin';
    }
    throw new ApiError(
      json.message || 'Request failed',
      res.status,
      json.code,
      json.params
    );
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
    throw new ApiError(
      json.message || 'Request failed',
      res.status,
      json.code,
      json.params
    );
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
  status: 'active' | 'inactive';
  monthly_salary?: number | null;
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
  has_size: boolean;
  auto_reduce: boolean;
}

export interface CoffeeSettings {
  id: number;
  ingredient_id: number | null;
  price_per_cup: string | number | null;
  cups_per_kg: string | number;
  is_active: boolean;
  ingredient?: Pick<Ingredient, 'id' | 'name' | 'unit' | 'current_stock'> | null;
  current_stock_kg: number;
  available_cups: number;
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
  min_stock_bottles: number;
  low_stock?: boolean;
  low_stock_small?: boolean;
  low_stock_large?: boolean;
}

export interface DishIngredient {
  id: number;
  ingredient_id: number;
  quantity_per_plate: string | number;
  size: 'small' | 'large' | null;
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
  price_half_slice: string | number | null;
  is_active: boolean;
  recipe?: DishIngredient[];
}

export interface Purchase {
  id: number;
  ingredient_id: number;
  size: 'small' | 'large' | null;
  quantity: string | number;
  unit_price: string | number;
  total_price: string | number;
  status: 'pending' | 'in_inventory' | 'handed' | 'received';
  screenshot_path: string | null;
  created_at?: string;
  createdAt?: string;
  approved_at: string | null;
  handed_at: string | null;
  received_at: string | null;
  ingredient?: Ingredient;
  purchaser?: { id: number; name: string; short_id: string };
  approver?: { id: number; name: string; short_id: string };
  chief?: { id: number; name: string; short_id: string };
}

export interface PurchaserInventorySummary {
  ingredient_id: number;
  size: 'small' | 'large' | null;
  ingredient?: Ingredient;
  total_quantity: number;
}

export interface PurchaserInventory {
  summary: PurchaserInventorySummary[];
  purchases: Purchase[];
}

export interface Sale {
  id: number;
  dish_id: number | null;
  sale_type?: 'plate' | 'coffee' | 'water';
  seller_id: number;
  weight_type: 'quarter' | 'half' | 'kilo' | 'slice' | 'half_slice' | null;
  water_bottle_size?: 'small' | 'large' | null;
  slice_count: number | null;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
  kilo_consumed: string | number;
  payment_method: string;
  tip_amount?: string | number;
  sold_at: string;
  dish?: Dish;
  seller?: { id: number; name: string; short_id: string; role?: User['role'] };
}

export interface PlateAvailability {
  produced_kg: number;
  produced_plates: number;
  sold_kg: number;
  available_kg: number;
}

export interface TodayPlateRow {
  dish_id: number | null;
  dish_name: string | null;
  date: string;
  produced_kg: number;
  produced_plates: number;
  sold_kg: number;
  remaining_kg: number | null;
}

export interface TotalPlatePool {
  produced_kg: number;
  sold_kg: number;
  available_kg: number;
  remaining_kg: number;
}

export interface TodayPlatesOverview {
  date: string;
  plates: TodayPlateRow[];
  summary?: TotalPlatePool;
}

export interface PosDefaultPrices {
  price_quarter: string | number | null;
  price_half: string | number | null;
  price_kilo: string | number | null;
  price_per_slice: string | number | null;
  price_half_slice: string | number | null;
}

export interface PlatesHistoryOverview {
  plates: TodayPlateRow[];
  summary?: TotalPlatePool;
}

export interface DailySalesPayments {
  cash: number;
  cbe: number;
  telebirr: number;
  awash: number;
  dashen: number;
  abyssinia: number;
  nib: number;
  coop: number;
  other: number;
}

export interface DailySalesDishRow {
  dish_id: number;
  dish_name: string;
  produced_kg: number;
  produced_plates: number;
  sold_kg: number;
  remaining_kg: number;
  revenue: number;
  sale_count: number;
}

export interface DailySalesSellerRow {
  seller_id: number;
  seller_name: string;
  role: User['role'] | null;
  sales_revenue: number;
  tips_total: number;
  revenue: number;
  sale_count: number;
  kilo_sold: number;
}

export interface DailySalesOverview {
  date: string;
  summary: {
    total_revenue: number;
    total_tips: number;
    sale_count: number;
    kilo_sold: number;
    payments: DailySalesPayments;
    plate_pool: TotalPlatePool;
  };
  by_dish: DailySalesDishRow[];
  by_seller: DailySalesSellerRow[];
  sales: Sale[];
}

export interface ReportSummary {
  expense: number;
  ingredient_expense: number;
  operating_expense: number;
  expense_by_category: {
    rental: number;
    salaries: number;
    electricity: number;
    other: number;
    tips: number;
    chief_expenses: number;
  };
  income: number;
  net_profit: number;
  purchase_count: number;
  sale_count: number;
  active_inventory: number;
  low_stock: Ingredient[];
  top_dishes: Array<{
    dish_id: number;
    total_revenue: string;
    sale_count: string;
    dish?: { name: string };
  }>;
}

export type ExpenseCategory = 'rental' | 'salaries' | 'electricity' | 'other' | 'tips';

export interface Expense {
  id: number;
  category: ExpenseCategory;
  amount: string | number;
  description: string | null;
  spent_at: string;
  receipt_path: string | null;
  created_by: number;
  created_at?: string;
  creator?: { id: number; name: string; short_id: string };
}

export interface ExpenseSummary {
  total: number;
  by_category: {
    rental: number;
    salaries: number;
    electricity: number;
    other: number;
    tips: number;
  };
}

export type ChiefExpenseCategory = 'food' | 'hotel' | 'other';

export interface ChiefExpense {
  id: number;
  chief_id: number;
  category: ChiefExpenseCategory;
  amount: string | number;
  description: string | null;
  spent_at: string;
  created_by: number;
  created_at?: string;
  chief?: { id: number; name: string; short_id: string };
  creator?: { id: number; name: string; short_id: string };
}

export interface ChiefExpenseSummary {
  total: number;
  count: number;
  by_category: {
    food: number;
    hotel: number;
    other: number;
  };
}

export interface PayrollPayment {
  paid_at: string;
  amount: number;
  expense_id: number;
}

export interface PayrollEmployee {
  id: number;
  name: string;
  short_id: string;
  status: 'active' | 'inactive';
  monthly_salary: number | null;
  payment: PayrollPayment | null;
}

export interface PayrollOverview {
  period: string;
  summary: {
    total_payroll: number;
    paid_count: number;
    pending_count: number;
    paid_amount: number;
  };
  employees: PayrollEmployee[];
}

export interface TipPayoutPayment {
  paid_at: string;
  amount: number;
  expense_id: number;
}

export interface TipPayoutSeller {
  seller_id: number;
  name: string;
  short_id: string;
  role: User['role'];
  tips_earned: number;
  payment: TipPayoutPayment | null;
}

export interface TipPayoutOverview {
  period: string;
  summary: {
    total_tips: number;
    paid_count: number;
    pending_count: number;
    paid_amount: number;
  };
  sellers: TipPayoutSeller[];
}

export interface MonthlyAnalysisDishRow {
  dish_id: number;
  dish_name: string;
  revenue: number;
  sale_count: number;
}

export interface MonthlyAnalysisSellerRow {
  seller_id: number;
  seller_name: string;
  revenue: number;
  sale_count: number;
}

export interface MonthlyAnalysisDayRow {
  date: string;
  income: number;
  operating_expense: number;
  ingredient_expense: number;
  net: number;
}

export interface MonthlyAnalysis {
  period: string;
  period_label: string;
  income: number;
  ingredient_expense: number;
  operating_expense: number;
  expense: number;
  expense_by_category: {
    rental: number;
    salaries: number;
    electricity: number;
    other: number;
    tips: number;
    chief_expenses: number;
  };
  net_profit: number;
  sale_count: number;
  purchase_count: number;
  payments: DailySalesPayments;
  payroll: {
    total_payroll: number;
    paid_count: number;
    pending_count: number;
    paid_amount: number;
  };
  top_dishes: MonthlyAnalysisDishRow[];
  by_seller: MonthlyAnalysisSellerRow[];
  by_day: MonthlyAnalysisDayRow[];
}

export interface ProductionLog {
  id: number;
  dish_id: number;
  plates_count: number;
  plate_weight_grams?: string | number | null;
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
