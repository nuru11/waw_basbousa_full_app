import { useLocale } from "../../context/LocaleContext";
import { localeLabels } from "../../i18n";

export function LanguageToggleButton() {
  const { locale, toggleLocale } = useLocale();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className="flex items-center justify-center w-11 h-11 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl shadow-theme-xs touch-target hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 md:w-12 md:h-12 md:text-base"
      aria-label={`Switch language (current: ${localeLabels[locale]})`}
      title={`Switch language (current: ${localeLabels[locale]})`}
    >
      {localeLabels[locale]}
    </button>
  );
}
