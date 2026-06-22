import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "../locales/en/common.json";
import enNav from "../locales/en/nav.json";
import enAuth from "../locales/en/auth.json";
import enAdmin from "../locales/en/admin.json";
import enPurchaser from "../locales/en/purchaser.json";
import enChief from "../locales/en/chief.json";
import enEmployee from "../locales/en/employee.json";
import enErrors from "../locales/en/errors.json";
import enValidation from "../locales/en/validation.json";

import arCommon from "../locales/ar/common.json";
import arNav from "../locales/ar/nav.json";
import arAuth from "../locales/ar/auth.json";
import arAdmin from "../locales/ar/admin.json";
import arPurchaser from "../locales/ar/purchaser.json";
import arChief from "../locales/ar/chief.json";
import arEmployee from "../locales/ar/employee.json";
import arErrors from "../locales/ar/errors.json";
import arValidation from "../locales/ar/validation.json";

export const supportedLocales = ["en", "ar"] as const;
export type AppLocale = (typeof supportedLocales)[number];

export const localeLabels: Record<AppLocale, string> = {
  en: "EN",
  ar: "AR",
};

const namespaces = [
  "common",
  "nav",
  "auth",
  "admin",
  "purchaser",
  "chief",
  "employee",
  "errors",
  "validation",
] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        nav: enNav,
        auth: enAuth,
        admin: enAdmin,
        purchaser: enPurchaser,
        chief: enChief,
        employee: enEmployee,
        errors: enErrors,
        validation: enValidation,
      },
      ar: {
        common: arCommon,
        nav: arNav,
        auth: arAuth,
        admin: arAdmin,
        purchaser: arPurchaser,
        chief: arChief,
        employee: arEmployee,
        errors: arErrors,
        validation: arValidation,
      },
    },
    fallbackLng: "en",
    supportedLngs: [...supportedLocales],
    defaultNS: "common",
    ns: [...namespaces],
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
