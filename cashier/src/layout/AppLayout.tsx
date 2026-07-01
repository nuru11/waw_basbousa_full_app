import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Button from "../components/ui/button/Button";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import { LanguageToggleButton } from "../components/common/LanguageToggleButton";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { t } = useTranslation("cashier");
  const { t: tc } = useTranslation("common");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinkClass = (path: string) => {
    const active =
      path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(path);
    return `touch-target rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active
        ? "bg-white/25 text-white"
        : "text-white/80 hover:bg-white/15 hover:text-white"
    }`;
  };

  function handleLogout() {
    logout();
    navigate("/signin");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-brand-700 to-brand-500 shadow-theme-sm">
        <div className="flex items-center justify-between gap-4 px-4 py-3 mx-auto max-w-6xl md:px-6 md:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center shrink-0 w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm md:w-12 md:h-12">
              <img
                src="/logo/logo.png"
                alt="Logo"
                className="object-contain w-8 h-8 md:w-9 md:h-9"
              />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold truncate text-white md:text-lg">
                {t("mode.title")}
              </p>
              {user && (
                <p className="text-xs truncate text-white/80 md:text-sm">
                  {t("mode.userLine", { name: user.name, shortId: user.short_id })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <nav className="items-center hidden gap-1 mr-1 sm:flex">
              <Link to="/" className={navLinkClass("/")}>
                {t("nav.pos")}
              </Link>
              <Link to="/sales" className={navLinkClass("/sales")}>
                {t("nav.todaySales")}
              </Link>
            </nav>
            <LanguageToggleButton />
            <ThemeToggleButton />
            <Button
              size="md"
              variant="outline"
              onClick={handleLogout}
              className="hidden text-white bg-white/10 border-white/30 ring-0 hover:bg-white/20 sm:inline-flex"
            >
              {tc("logout")}
            </Button>
            <Button
              size="md"
              variant="outline"
              onClick={handleLogout}
              className="px-3 text-white bg-white/10 border-white/30 ring-0 hover:bg-white/20 sm:hidden"
              aria-label={tc("logout")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </Button>
          </div>
        </div>
      </header>
      <nav className="flex gap-2 px-4 py-2 mx-auto border-b border-gray-200 sm:hidden max-w-6xl dark:border-gray-800 md:px-6">
        <Link
          to="/"
          className={`flex-1 touch-target rounded-lg px-3 py-2 text-center text-sm font-semibold transition ${
            location.pathname === "/"
              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
              : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          {t("nav.pos")}
        </Link>
        <Link
          to="/sales"
          className={`flex-1 touch-target rounded-lg px-3 py-2 text-center text-sm font-semibold transition ${
            location.pathname.startsWith("/sales")
              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
              : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          {t("nav.todaySales")}
        </Link>
      </nav>
      <main className="flex-1 px-4 py-4 mx-auto w-full max-w-6xl md:px-6 md:py-6 lg:pb-6">
        <Outlet />
      </main>
    </div>
  );
}
