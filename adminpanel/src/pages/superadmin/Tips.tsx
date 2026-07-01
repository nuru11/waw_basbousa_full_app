import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import {
  DataTable,
  EmptyState,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/ui";
import type { DataTableColumn } from "../../components/ui";
import { api, type TipPayoutSeller, type TipPayoutOverview } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  currentMonthInput,
  formatPaidDate,
  formatPayPeriodLabel,
} from "../../utils/expenseCategory";
import { translateApiError } from "../../utils/translateApiError";

export default function TipsPage() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const [period, setPeriod] = useState(currentMonthInput());
  const [overview, setOverview] = useState<TipPayoutOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payingId, setPayingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .get<TipPayoutOverview>(`/tips?period=${period}`)
      .then(setOverview)
      .catch((e) => setError(translateApiError(e)))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkPaid(seller: TipPayoutSeller) {
    if (
      !window.confirm(
        t("tips.payConfirm", {
          name: seller.name,
          amount: formatCurrency(seller.tips_earned),
          period: formatPayPeriodLabel(period),
        })
      )
    ) {
      return;
    }

    setPayingId(seller.seller_id);
    setError("");
    setSuccess("");
    try {
      await api.post(`/tips/sellers/${seller.seller_id}/pay`, { period });
      setSuccess(t("tips.paidSuccess", { name: seller.name }));
      load();
    } catch (e) {
      setError(translateApiError(e));
    } finally {
      setPayingId(null);
    }
  }

  function renderMarkPaidButton(seller: TipPayoutSeller, fullWidth = false) {
    const canPay = seller.tips_earned > 0 && !seller.payment;

    return (
      <Button
        type="button"
        size="sm"
        disabled={!canPay || payingId === seller.seller_id}
        onClick={() => handleMarkPaid(seller)}
        className={fullWidth ? "w-full" : undefined}
      >
        {payingId === seller.seller_id ? t("tips.paying") : t("tips.markPaid")}
      </Button>
    );
  }

  const columns: DataTableColumn<TipPayoutSeller>[] = useMemo(
    () => [
      {
        key: "seller",
        header: tCommon("fields.seller"),
        render: (seller) => (
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">{seller.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {seller.short_id}
            </p>
          </div>
        ),
      },
      {
        key: "role",
        header: tCommon("fields.type"),
        render: (seller) =>
          seller.role ? tCommon(`roles.${seller.role}`) : tCommon("emDash"),
      },
      {
        key: "tipsEarned",
        header: t("tips.tipsEarned"),
        render: (seller) => (
          <span className="font-medium text-gray-800 dark:text-white/90">
            {formatCurrency(seller.tips_earned)}
          </span>
        ),
      },
      {
        key: "status",
        header: tCommon("fields.status"),
        render: (seller) => (
          <StatusBadge variant={seller.payment ? "received" : "pending"}>
            {seller.payment ? t("tips.paid") : t("tips.pending")}
          </StatusBadge>
        ),
      },
      {
        key: "paidOn",
        header: t("tips.paidOn"),
        render: (seller) =>
          seller.payment ? formatPaidDate(seller.payment.paid_at) : tCommon("emDash"),
      },
      {
        key: "action",
        header: tCommon("fields.action"),
        render: (seller) => renderMarkPaidButton(seller),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tCommon, payingId, period]
  );

  return (
    <div>
      <PageMeta
        title={t("tips.metaTitle")}
        description={t("tips.metaDescription")}
      />
      <PageBreadcrumb pageTitle={tNav("tips")} />

      {error && <p className="mb-4 text-sm text-error-500">{error}</p>}
      {success && <p className="mb-4 text-sm text-success-500">{success}</p>}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <Label>{t("tips.payPeriod")}</Label>
          <Input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-44"
          />
        </div>
        <p className="pb-2 text-sm text-gray-500 dark:text-gray-400">
          {t("tips.payoutHint")}
        </p>
      </div>

      {overview && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("tips.totalTips")}
            value={formatCurrency(overview.summary.total_tips)}
            subtitle={formatPayPeriodLabel(period)}
            accent="brand"
          />
          <StatCard
            title={t("tips.paidCount")}
            value={String(overview.summary.paid_count)}
            accent="success"
          />
          <StatCard
            title={t("tips.pendingCount")}
            value={String(overview.summary.pending_count)}
            accent="warning"
          />
          <StatCard
            title={t("tips.amountPaid")}
            value={formatCurrency(overview.summary.paid_amount)}
            accent="orange"
          />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">{tCommon("loading")}</p>
      ) : overview && overview.sellers.length === 0 ? (
        <EmptyState message={t("tips.noSellers")} />
      ) : (
        overview && (
          <SectionCard
            title={t("tips.sellerList")}
            count={tCommon("periodFilters.entryCount", {
              count: overview.sellers.length,
            })}
          >
            <div className="md:hidden space-y-4">
              {overview.sellers.map((seller) => (
                <div
                  key={seller.seller_id}
                  className="rounded-xl border border-gray-200 p-4 dark:border-white/[0.08]"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {seller.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {seller.short_id}
                      </p>
                    </div>
                    <StatusBadge variant={seller.payment ? "received" : "pending"}>
                      {seller.payment ? t("tips.paid") : t("tips.pending")}
                    </StatusBadge>
                  </div>

                  <div className="mb-3 flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {t("tips.tipsEarned")}
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {formatCurrency(seller.tips_earned)}
                    </span>
                  </div>

                  <div className="mb-3 flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {t("tips.paidOn")}
                    </span>
                    <span className="text-gray-800 dark:text-white/90">
                      {seller.payment
                        ? formatPaidDate(seller.payment.paid_at)
                        : tCommon("emDash")}
                    </span>
                  </div>

                  {renderMarkPaidButton(seller, true)}
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <DataTable
                columns={columns}
                data={overview.sellers}
                keyExtractor={(seller) => seller.seller_id}
                hoverRows
              />
            </div>
          </SectionCard>
        )
      )}
    </div>
  );
}
