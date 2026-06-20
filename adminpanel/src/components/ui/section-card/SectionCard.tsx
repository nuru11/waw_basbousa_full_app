import type { ReactNode } from "react";
import { cn } from "../../../utils/cn";

interface SectionCardProps {
  title: string;
  count?: string | number;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  count,
  children,
  className,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {count !== undefined && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
