import { useTranslation } from "react-i18next";
import PageMeta from "../components/common/PageMeta";
import SignInForm from "../components/auth/SignInForm";
import { LanguageToggleButton } from "../components/common/LanguageToggleButton";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";

export default function SignInPage() {
  const { t } = useTranslation("auth");

  return (
    <>
      <PageMeta
        title={t("meta.signInTitle")}
        description={t("meta.signInDescription")}
      />
      <div className="relative flex flex-col justify-center min-h-screen px-4 py-8 bg-gradient-to-br from-brand-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="fixed z-50 flex items-center gap-2 top-4 end-4">
          <LanguageToggleButton />
          <ThemeToggleButton />
        </div>
        <div className="w-full max-w-lg mx-auto overflow-hidden rounded-2xl shadow-theme-sm md:max-w-md">
          <div className="px-6 py-5 bg-gradient-to-r from-brand-700 to-brand-500">
            <p className="text-lg font-bold text-center text-white">{t("layout.tagline")}</p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900 md:p-8">
            <SignInForm />
          </div>
        </div>
      </div>
    </>
  );
}
