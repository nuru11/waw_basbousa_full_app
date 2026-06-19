import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import { useAuth } from "../../context/AuthContext";
import { ApiError, type User } from "../../services/api";
import { getRoleHome, isCashierEligible } from "../../utils/roleRoutes";

export default function SignInForm() {
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
        setError(err instanceof ApiError ? err.message : "Login failed");
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
          <ChevronLeftIcon className="size-5" />
          Restaurant App
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your username and password to sign in
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
                    Username <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="superadmin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
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
                      Keep me logged in
                    </span>
                  </div>
                </div>
                <div>
                  <Button type="submit" className="w-full" size="sm" disabled={submitting}>
                    {submitting ? "Signing in..." : "Sign in"}
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
          Login as cashier?
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Choose cashier mode to open only the sales screen. Otherwise you will see your full
          workspace.
        </p>
        <div className="flex gap-3">
          <Button size="sm" className="flex-1" onClick={() => handleCashierChoice(true)}>
            Yes, cashier only
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleCashierChoice(false)}>
            No, full access
          </Button>
        </div>
      </Modal>
    </div>
  );
}
