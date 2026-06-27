import { useTranslation } from "react-i18next";
import PageMeta from "../components/common/PageMeta";
import SalesForm from "../components/sales/SalesForm";

export default function PosPage() {
  const { t } = useTranslation("cashier");

  return (
    <div>
      <PageMeta title={t("pos.metaTitle")} description={t("pos.metaDescription")} />
      <div className="mb-5 md:mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
          {t("pos.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 md:text-base">{t("pos.subtitle")}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-3 py-1.5 text-xs font-bold rounded-full md:text-sm bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            {t("pos.stepAddItems")}
          </span>
          <span className="px-3 py-1.5 text-xs font-bold rounded-full md:text-sm bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {t("pos.stepPay")}
          </span>
        </div>
      </div>
      <SalesForm />
    </div>
  );
}
