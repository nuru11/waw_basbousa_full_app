import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "../locales/en/common.json";
import enAuth from "../locales/en/auth.json";
import enCashier from "../locales/en/cashier.json";
import enErrors from "../locales/en/errors.json";

import arCommon from "../locales/ar/common.json";
import arAuth from "../locales/ar/auth.json";
import arCashier from "../locales/ar/cashier.json";
import arErrors from "../locales/ar/errors.json";

export const supportedLocales = ["en", "ar"] as const;
export type AppLocale = (typeof supportedLocales)[number];

export const localeLabels: Record<AppLocale, string> = {
  en: "EN",
  ar: "AR",
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        cashier: enCashier,
        errors: enErrors,
      },
      ar: {
        common: arCommon,
        auth: arAuth,
        cashier: arCashier,
        errors: arErrors,
      },
    },
    fallbackLng: "en",
    supportedLngs: [...supportedLocales],
    defaultNS: "common",
    ns: ["common", "auth", "cashier", "errors"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "locale",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export function applyDocumentLocale(locale: AppLocale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

export function getIntlLocale(locale?: string): string {
  const lng = locale || i18n.language;
  return lng === "ar" ? "ar-ET" : "en-ET";
}

export default i18n;
