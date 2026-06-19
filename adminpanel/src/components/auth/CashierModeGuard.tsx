import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function CashierModeGuard() {
  const { user, cashierMode } = useAuth();

  if (
    user &&
    cashierMode &&
    (user.role === "employee" || user.role === "chief")
  ) {
    return <Navigate to="/cashier/pos" replace />;
  }

  return <Outlet />;
}
