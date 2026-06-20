import { useLocale } from "../../context/LocaleContext";
import { localeLabels } from "../../i18n";

export function LanguageToggleButton() {
  const { locale, toggleLocale } = useLocale();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 lg:h-11 lg:w-11"
      aria-label={`Switch language (current: ${localeLabels[locale]})`}
      title={`Switch language (current: ${localeLabels[locale]})`}
    >
      {localeLabels[locale]}
    </button>
  );
}
