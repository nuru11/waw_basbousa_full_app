import { Navigate, Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import type { User } from "../../services/api";
import { getRoleHome } from "../../utils/roleRoutes";

interface ProtectedRouteProps {
  allowedRoles?: User["role"][];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return <Outlet />;
}
