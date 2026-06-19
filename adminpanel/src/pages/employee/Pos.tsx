import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SalesForm from "../../components/sales/SalesForm";

export default function PosPage() {
  return (
    <div>
      <PageMeta title="POS | Restaurant" description="Point of sale" />
      <PageBreadcrumb pageTitle="Point of Sale" />
      <SalesForm />
    </div>
  );
}
