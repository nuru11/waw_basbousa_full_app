import { Outlet, useNavigate } from "react-router";
import Button from "../components/ui/button/Button";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import { useAuth } from "../context/AuthContext";

export default function CashierLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/signin");
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div>
          <p className="font-semibold text-gray-800 dark:text-white/90">Cashier Mode</p>
          {user && (
            <p className="text-xs text-gray-500">
              {user.name} · #{user.short_id}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <Button size="sm" variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="p-4 mx-auto max-w-lg md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
