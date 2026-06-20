import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import TransferHistoryTable from "../../components/transfers/TransferHistoryTable";
import { SectionCard, StatCard } from "../../components/ui";
import { api, type Transfer, type TransferSummary, type User } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { translateApiError } from "../../utils/translateApiError";

export default function TransfersPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [summary, setSummary] = useState<TransferSummary | null>(null);
  const [purchasers, setPurchasers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    amount: "",
    purchaser_id: "",
  });
  const { submitting, run } = useSubmitLock();

  const load = () => {
    api.get<Transfer[]>("/transfers?period=week").then(setTransfers).catch((e) => setError(translateApiError(e)));
    api.get<TransferSummary>("/transfers/summary").then(setSummary).catch((e) => setError(translateApiError(e)));
    api
      .get<User[]>("/admins")
      .then((admins) => setPurchasers(admins.filter((a) => a.role === "purchaser")))
      .catch((e) => setError(translateApiError(e)));
  };

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      setError("");
      setSuccess("");
      try {
        await api.post("/transfers", {
          amount: parseFloat(form.amount),
          purchaser_id: parseInt(form.purchaser_id),
        });
        setSuccess(t("transfers.sentSuccess"));
        setForm({ amount: "", purchaser_id: "" });
        load();
      } catch (err: unknown) {
        setError(translateApiError(err, "common:failed"));
      }
    });
  }

  return (
    <div>
      <PageMeta title={t("transfers.metaTitle")} description={t("transfers.metaDescription")} />
      <PageBreadcrumb pageTitle={tNav("transfer")} />

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title={tCommon("transfers.totalSent")}
            value={formatCurrency(parseFloat(String(summary.total_sent)))}
            accent="brand"
          />
          <StatCard
            title={tCommon("transfers.pendingAcceptance")}
            value={formatCurrency(parseFloat(String(summary.total_pending)))}
            accent="warning"
          />
          <StatCard
            title={tCommon("transfers.accepted")}
            value={formatCurrency(parseFloat(String(summary.total_transferred)))}
            accent="success"
          />
          <StatCard
            title={tCommon("transfers.totalSpent")}
            value={formatCurrency(parseFloat(String(summary.total_spent)))}
            accent="orange"
          />
          <StatCard
            title={tCommon("transfers.totalRemaining")}
            value={formatCurrency(parseFloat(String(summary.total_remaining)))}
            accent={summary.total_remaining < 0 ? "error" : "success"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title={t("transfers.newTransfer")}>
          <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-error-500">{error}</p>}
          {success && <p className="text-sm text-success-500">{success}</p>}
          <div>
            <Label>{t("transfers.amountEtb")}</Label>
            <Input
              type="number"
              step={0.01}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("transfers.toPurchaser")}</Label>
            <Select
              value={form.purchaser_id}
              onChange={(purchaser_id) => setForm({ ...form, purchaser_id })}
              placeholder={tCommon("fields.selectPurchaser")}
              options={purchasers.map((p) => ({
                value: String(p.id),
                label: p.name,
              }))}
            />
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? tCommon("actions.transferring") : tCommon("actions.transfer")}
          </Button>
          </form>
        </SectionCard>
        <SectionCard title={t("transfers.thisWeek")} className="lg:col-span-2">
          <TransferHistoryTable
            transfers={transfers}
            emptyMessage={t("transfers.noTransfersThisWeek")}
          />
        </SectionCard>
      </div>
    </div>
  );
}
