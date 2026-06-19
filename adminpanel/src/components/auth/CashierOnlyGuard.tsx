import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { getRoleHome } from "../../utils/roleRoutes";

export default function CashierOnlyGuard() {
  const { user, cashierMode } = useAuth();

  if (!user) return <Navigate to="/signin" replace />;

  if (!cashierMode) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return <Outlet />;
}
