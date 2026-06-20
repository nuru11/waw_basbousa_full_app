"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n, {
  applyDocumentLocale,
  type AppLocale,
  supportedLocales,
} from "../i18n";

type LocaleContextType = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

function normalizeLocale(value: string | undefined): AppLocale {
  if (value?.startsWith("ar")) return "ar";
  return "en";
}

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { i18n: i18nInstance } = useTranslation();
  const [locale, setLocaleState] = useState<AppLocale>(() =>
    normalizeLocale(i18nInstance.language)
  );

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      const next = normalizeLocale(lng);
      setLocaleState(next);
      applyDocumentLocale(next);
    };

    handleLanguageChange(i18nInstance.language);
    i18nInstance.on("languageChanged", handleLanguageChange);
    return () => {
      i18nInstance.off("languageChanged", handleLanguageChange);
    };
  }, [i18nInstance]);

  const setLocale = (next: AppLocale) => {
    void i18n.changeLanguage(next);
  };

  const toggleLocale = () => {
    const idx = supportedLocales.indexOf(locale);
    const next = supportedLocales[(idx + 1) % supportedLocales.length];
    setLocale(next);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
};
