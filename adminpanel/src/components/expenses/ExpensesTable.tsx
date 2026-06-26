import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, StatusBadge } from "../ui";
import type { DataTableColumn } from "../ui";
import type { Expense } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  expenseCategoryLabel,
  expenseCategoryVariant,
  formatSpentDate,
} from "../../utils/expenseCategory";
import ExpenseReceipt from "./ExpenseReceipt";

type Props = {
  expenses: Expense[];
  emptyMessage?: string;
  onDelete?: (expense: Expense) => void;
  deletingId?: number | null;
};

export default function ExpensesTable({
  expenses,
  emptyMessage,
  onDelete,
  deletingId,
}: Props) {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");

  const columns: DataTableColumn<Expense>[] = useMemo(
    () => [
      {
        key: "spent_at",
        header: tCommon("fields.date"),
        render: (e) => formatSpentDate(e.spent_at),
      },
      {
        key: "category",
        header: tCommon("fields.category"),
        render: (e) => (
          <StatusBadge variant={expenseCategoryVariant(e.category)}>
            {expenseCategoryLabel(e.category, t)}
          </StatusBadge>
        ),
      },
      {
        key: "description",
        header: tCommon("fields.description"),
        render: (e) => e.description || tCommon("emDash"),
      },
      {
        key: "amount",
        header: tCommon("fields.amount"),
        render: (e) => formatCurrency(parseFloat(String(e.amount))),
      },
      {
        key: "creator",
        header: tCommon("fields.recordedBy"),
        render: (e) => e.creator?.name ?? tCommon("emDash"),
      },
      {
        key: "receipt",
        header: tCommon("fields.receipt"),
        render: (e) => (
          <ExpenseReceipt
            expenseId={e.id}
            hasReceipt={!!e.receipt_path}
            alt={t("expenses.receiptAlt")}
          />
        ),
      },
      ...(onDelete
        ? [
            {
              key: "actions",
              header: tCommon("fields.actions"),
              render: (e: Expense) => (
                <button
                  type="button"
                  onClick={() => onDelete(e)}
                  disabled={deletingId === e.id}
                  className="text-sm text-error-500 hover:underline disabled:opacity-50"
                >
                  {deletingId === e.id
                    ? tCommon("actions.deleting")
                    : tCommon("actions.delete")}
                </button>
              ),
            } as DataTableColumn<Expense>,
          ]
        : []),
    ],
    [t, tCommon, onDelete, deletingId]
  );

  return (
    <DataTable
      columns={columns}
      data={expenses}
      keyExtractor={(e) => e.id}
      hoverRows
      emptyMessage={emptyMessage}
    />
  );
}
