import { useTranslation } from "react-i18next";
import PageMeta from "../../components/common/PageMeta";
import SalesForm from "../../components/sales/SalesForm";

export default function CashierPosPage() {
  const { t } = useTranslation(["cashier"]);

  return (
    <div>
      <PageMeta title={t("pos.metaTitle")} description={t("pos.metaDescription")} />
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {t("pos.title")}
        </h1>
        <p className="text-sm text-gray-500">{t("pos.subtitle")}</p>
      </div>
      <SalesForm compact />
    </div>
  );
}
