import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { useAuth } from "../../context/AuthContext";
import { isCashierRole, getHomePath } from "../../utils/roles";
import { translateApiError } from "../../utils/translateApiError";

export default function SignInForm() {
  const { t } = useTranslation("auth");
  const { t: tc } = useTranslation("common");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { submitting, run } = useSubmitLock();
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      setError("");
      try {
        const user = await login(username, password);
        if (!isCashierRole(user.role)) {
          logout();
          setError(t("signIn.notAuthorized"));
          return;
        }
        navigate(getHomePath());
      } catch (err) {
        setError(translateApiError(err, "auth:signIn.loginFailed"));
      }
    });
  }

  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="mb-6 text-center">
        <img
          src="/logo/logo.png"
          alt={t("layout.logoAlt")}
          className="object-contain w-16 h-16 mx-auto mb-4 md:w-20 md:h-20"
        />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("signIn.title")}
        </h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 text-sm rounded-xl text-error-500 bg-error-50 dark:bg-error-500/10 md:text-base">
            {error}
          </div>
        )}
        <div>
          <Label>
            {t("signIn.username")}{" "}
            <span className="text-error-500">{tc("required")}</span>
          </Label>
          <Input
            placeholder={t("signIn.usernamePlaceholder")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-base"
          />
        </div>
        <div>
          <Label>
            {t("signIn.password")}{" "}
            <span className="text-error-500">{tc("required")}</span>
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("signIn.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute z-30 px-3 py-2 text-sm font-medium -translate-y-1/2 rounded-lg cursor-pointer touch-target end-2 top-1/2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? t("signIn.submitting") : t("signIn.submit")}
        </Button>
      </form>
    </div>
  );
}
