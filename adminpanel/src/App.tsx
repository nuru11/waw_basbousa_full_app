import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRedirect from "./components/auth/RoleRedirect";

import AdminDashboard from "./pages/superadmin/Dashboard";
import StaffPage from "./pages/superadmin/Staff";
import IngredientsPage from "./pages/superadmin/Ingredients";
import DishesPage from "./pages/superadmin/Dishes";
import ReportsPage from "./pages/superadmin/Reports";
import TransfersPage from "./pages/superadmin/Transfers";
import TransferHistoryPage from "./pages/superadmin/TransferHistoryPage";
import PendingPurchasesPage from "./pages/superadmin/PendingPurchases";

import PurchasesPage from "./pages/purchaser/Purchases";
import PurchaserInventoryPage from "./pages/purchaser/Inventory";
import PendingTransfersPage from "./pages/purchaser/PendingTransfers";

import PendingReceiptsPage from "./pages/chief/PendingReceipts";
import InventoryPage from "./pages/chief/Inventory";
import RecipesPage from "./pages/chief/Recipes";
import ProductionPage from "./pages/chief/Production";

import PosPage from "./pages/employee/Pos";
import MySalesPage from "./pages/employee/MySales";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/signin" element={<SignIn />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index path="/" element={<RoleRedirect />} />

            <Route element={<ProtectedRoute allowedRoles={["superAdmin"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/staff" element={<StaffPage />} />
              <Route path="/admin/ingredients" element={<IngredientsPage />} />
              <Route path="/admin/dishes" element={<DishesPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/transfers" element={<TransfersPage />} />
              <Route path="/admin/transfers/history" element={<TransferHistoryPage />} />
              <Route path="/admin/purchases" element={<PendingPurchasesPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["purchaser"]} />}>
              <Route path="/purchaser/transfers" element={<PendingTransfersPage />} />
              <Route path="/purchaser/purchases" element={<PurchasesPage />} />
              <Route path="/purchaser/inventory" element={<PurchaserInventoryPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["chief"]} />}>
              <Route path="/chief/receipts" element={<PendingReceiptsPage />} />
              <Route path="/chief/inventory" element={<InventoryPage />} />
              <Route path="/chief/recipes" element={<RecipesPage />} />
              <Route path="/chief/production" element={<ProductionPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
              <Route path="/employee/pos" element={<PosPage />} />
              <Route path="/employee/sales" element={<MySalesPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
