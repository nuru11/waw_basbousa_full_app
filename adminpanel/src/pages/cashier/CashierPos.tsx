import PageMeta from "../../components/common/PageMeta";
import SalesForm from "../../components/sales/SalesForm";

export default function CashierPosPage() {
  return (
    <div>
      <PageMeta title="Cashier | Restaurant" description="Cashier point of sale" />
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Cashier</h1>
        <p className="text-sm text-gray-500">Record a sale</p>
      </div>
      <SalesForm compact />
    </div>
  );
}
