import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { useAuth } from "../../context/AuthContext";
import { type User } from "../../services/api";
import { getRoleHome, isCashierEligible } from "../../utils/roleRoutes";
import { translateApiError } from "../../utils/translateApiError";

export default function SignInForm() {
  const { t } = useTranslation("auth");
  const { t: tc } = useTranslation("common");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const { submitting, run } = useSubmitLock();
  const { login, setCashierMode } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      setError("");
      try {
        const user = await login(username, password);
        if (isCashierEligible(user.role)) {
          setPendingUser(user);
        } else {
          navigate(getRoleHome(user.role));
        }
      } catch (err) {
        setError(translateApiError(err, "auth:signIn.loginFailed"));
      }
    });
  }

  function handleCashierChoice(asCashier: boolean) {
    if (!pendingUser) return;
    setCashierMode(asCashier);
    setPendingUser(null);
    navigate(getRoleHome(pendingUser.role, asCashier));
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5 rtl:rotate-180" />
          {tc("appName")}
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t("signIn.title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("signIn.subtitle")}
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {error && (
                  <div className="p-3 text-sm text-error-500 bg-error-50 rounded-lg dark:bg-error-500/10">
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
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer end-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      {t("signIn.keepLoggedIn")}
                    </span>
                  </div>
                </div>
                <div>
                  <Button type="submit" className="w-full" size="sm" disabled={submitting}>
                    {submitting ? t("signIn.submitting") : t("signIn.submit")}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!pendingUser}
        onClose={() => handleCashierChoice(false)}
        showCloseButton={false}
        className="max-w-md p-6 m-4"
      >
        <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("cashierModal.title")}
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          {t("cashierModal.description")}
        </p>
        <div className="flex gap-3">
          <Button size="sm" className="flex-1" onClick={() => handleCashierChoice(true)}>
            {t("cashierModal.yes")}
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleCashierChoice(false)}>
            {t("cashierModal.no")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
