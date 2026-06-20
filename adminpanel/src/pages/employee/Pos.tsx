import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SalesForm from "../../components/sales/SalesForm";

export default function PosPage() {
  const { t } = useTranslation(["employee", "nav"]);

  return (
    <div>
      <PageMeta title={t("pos.metaTitle")} description={t("pos.metaDescription")} />
      <PageBreadcrumb pageTitle={t("nav:pointOfSale")} />
      <SalesForm />
    </div>
  );
}
