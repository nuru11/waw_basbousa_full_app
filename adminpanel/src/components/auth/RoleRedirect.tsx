import { Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { getRoleHome } from "../../utils/roleRoutes";

export default function RoleRedirect() {
  const { t } = useTranslation("common");
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">{t("loading")}</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/signin" replace />;
  return <Navigate to={getRoleHome(user.role)} replace />;
}
