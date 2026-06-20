import { cn } from "../../../utils/cn";

export type StatCardAccent =
  | "brand"
  | "success"
  | "warning"
  | "error"
  | "orange"
  | "info"
  | "neutral";

const accentStyles: Record<
  StatCardAccent,
  { container: string; dot: string }
> = {
  brand: {
    container: "bg-brand-50 dark:bg-brand-500/10 border-brand-100 dark:border-brand-500/20",
    dot: "bg-brand-500",
  },
  success: {
    container: "bg-success-50 dark:bg-success-500/10 border-success-100 dark:border-success-500/20",
    dot: "bg-success-500",
  },
  warning: {
    container: "bg-warning-50 dark:bg-warning-500/10 border-warning-100 dark:border-warning-500/20",
    dot: "bg-warning-500",
  },
  error: {
    container: "bg-error-50 dark:bg-error-500/10 border-error-100 dark:border-error-500/20",
    dot: "bg-error-500",
  },
  orange: {
    container: "bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20",
    dot: "bg-orange-500",
  },
  info: {
    container: "bg-blue-light-50 dark:bg-blue-light-500/10 border-blue-light-100 dark:border-blue-light-500/20",
    dot: "bg-blue-light-500",
  },
  neutral: {
    container: "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-gray-800",
    dot: "bg-gray-400",
  },
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  accent?: StatCardAccent;
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  accent = "neutral",
  className,
}: StatCardProps) {
  const styles = accentStyles[accent];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 shadow-theme-xs",
        styles.container,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn("mt-1.5 size-2 shrink-0 rounded-full", styles.dot)}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
