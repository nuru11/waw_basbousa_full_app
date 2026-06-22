import { Navigate, Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { isCashierRole, getHomePath } from "../../utils/roles";

export default function ProtectedRoute() {
  const { t } = useTranslation("common");
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">{t("loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace />;
  }

  if (!isCashierRole(user.role)) {
    return <Navigate to="/signin?unauthorized=1" replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated && user) {
    if (isCashierRole(user.role)) {
      return <Navigate to={getHomePath()} replace />;
    }
    logout();
  }

  return <Outlet />;
}
