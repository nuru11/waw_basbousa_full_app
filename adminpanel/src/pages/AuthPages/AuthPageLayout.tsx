import React from "react";
import { useTranslation } from "react-i18next";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import { LanguageToggleButton } from "../../components/common/LanguageToggleButton";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation("auth");

  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="block mb-4">
                <img
                  width={120}
                  height={120}
                  src="/logo/logo.png"
                  alt={t("layout.logoAlt", { defaultValue: "Logo" })}
                  className="object-contain"
                />
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60">
                {t("layout.tagline")}
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 end-6 sm:flex sm:items-center sm:gap-2">
          <LanguageToggleButton />
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
