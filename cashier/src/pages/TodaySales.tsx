import { useTranslation } from "react-i18next";
import PageMeta from "../components/common/PageMeta";
import TodaySalesList from "../components/sales/TodaySalesList";

export default function TodaySalesPage() {
  const { t } = useTranslation("cashier");

  return (
    <div>
      <PageMeta
        title={t("todaySales.metaTitle")}
        description={t("todaySales.metaDescription")}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
          {t("todaySales.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("todaySales.subtitle")}
        </p>
      </div>
      <TodaySalesList />
    </div>
  );
}
