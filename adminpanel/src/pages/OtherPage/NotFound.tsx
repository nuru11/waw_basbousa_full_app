import { useTranslation } from "react-i18next";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function NotFound() {
  const { t } = useTranslation("errors");

  return (
    <>
      <PageMeta
        title={t("notFound.metaTitle")}
        description={t("notFound.metaDescription")}
      />
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
        <GridShape />
        <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
          <h1 className="mb-8 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl">
            {t("notFound.title")}
          </h1>

          <img src="/images/error/404.svg" alt={t("notFound.imageAlt")} className="dark:hidden" />
          <img
            src="/images/error/404-dark.svg"
            alt={t("notFound.imageAlt")}
            className="hidden dark:block"
          />

          <p className="mt-10 mb-6 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
            {t("notFound.message")}
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            {t("notFound.backHome")}
          </Link>
        </div>
        <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 start-1/2 dark:text-gray-400">
          {t("notFound.footer", { year: new Date().getFullYear() })}
        </p>
      </div>
    </>
  );
}
