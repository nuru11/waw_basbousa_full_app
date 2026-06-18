import { useEffect, useState, type FormEvent } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useSubmitLock } from "../../hooks/useSubmitLock";
import TransferHistoryTable from "../../components/transfers/TransferHistoryTable";
import { api, type Transfer, type TransferSummary, type User } from "../../services/api";

function formatEtb(value: number | string) {
  return parseFloat(String(value)).toFixed(2);
}

export default function TransfersPage() {
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
    api.get<Transfer[]>("/transfers?period=week").then(setTransfers).catch((e) => setError(e.message));
    api.get<TransferSummary>("/transfers/summary").then(setSummary).catch((e) => setError(e.message));
    api
      .get<User[]>("/admins")
      .then((admins) => setPurchasers(admins.filter((a) => a.role === "purchaser")))
      .catch((e) => setError(e.message));
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
        setSuccess("Transfer sent — awaiting purchaser acceptance");
        setForm({ amount: "", purchaser_id: "" });
        load();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div>
      <PageMeta title="Transfer | Restaurant" description="Allocate funds to purchasers" />
      <PageBreadcrumb pageTitle="Transfer" />

      {summary && (
        <div className="p-5 mb-6 rounded-2xl border border-gray-200 dark:border-gray-800">
          <h3 className="mb-3 font-semibold">Transfer Summary</h3>
          <div className="flex flex-wrap gap-6 text-sm">
            <p>
              <span className="text-gray-500">Total Sent:</span>{" "}
              <span className="font-medium">ETB {formatEtb(summary.total_sent)}</span>
            </p>
            <p>
              <span className="text-gray-500">Pending Acceptance:</span>{" "}
              <span className="font-medium text-warning-500">
                ETB {formatEtb(summary.total_pending)}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Accepted:</span>{" "}
              <span className="font-medium">ETB {formatEtb(summary.total_transferred)}</span>
            </p>
            <p>
              <span className="text-gray-500">Total Spent:</span>{" "}
              <span className="font-medium">ETB {formatEtb(summary.total_spent)}</span>
            </p>
            <p>
              <span className="text-gray-500">Total Remaining:</span>{" "}
              <span
                className={`font-medium ${
                  summary.total_remaining < 0 ? "text-error-500" : "text-success-500"
                }`}
              >
                ETB {formatEtb(summary.total_remaining)}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 rounded-2xl border border-gray-200 dark:border-gray-800"
        >
          <h3 className="font-semibold">New Transfer</h3>
          {error && <p className="text-sm text-error-500">{error}</p>}
          {success && <p className="text-sm text-success-500">{success}</p>}
          <div>
            <Label>Amount (ETB)</Label>
            <Input
              type="number"
              step={0.01}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div>
            <Label>To (Purchaser)</Label>
            <select
              className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900"
              value={form.purchaser_id}
              onChange={(e) => setForm({ ...form, purchaser_id: e.target.value })}
            >
              <option value="">Select purchaser</option>
              {purchasers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Transferring..." : "Transfer"}
          </Button>
        </form>
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 lg:col-span-2 overflow-x-auto">
          <h3 className="mb-4 font-semibold">This Week&apos;s Transfers</h3>
          <TransferHistoryTable
            transfers={transfers}
            emptyMessage="No transfers this week"
          />
        </div>
      </div>
    </div>
  );
}
