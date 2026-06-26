import { useEffect, useState } from "react";
import { api } from "../../services/api";

type Props = {
  expenseId: number;
  hasReceipt: boolean;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
};

const DEFAULT_CLASS =
  "rounded-lg border border-gray-200 dark:border-gray-700 object-cover bg-gray-100 dark:bg-gray-800";

export default function ExpenseReceipt({
  expenseId,
  hasReceipt,
  className,
  alt = "Expense receipt",
  width = 64,
  height = 64,
}: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!hasReceipt) return;

    let objectUrl: string | null = null;
    api
      .getBlob(`/expenses/${expenseId}/receipt`)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setError(true));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [expenseId, hasReceipt]);

  const boxStyle = { width, height };

  if (!hasReceipt) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-xs text-gray-400 dark:border-gray-700"
        style={boxStyle}
      >
        —
      </span>
    );
  }

  if (error) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-400 dark:border-gray-700"
        style={boxStyle}
      >
        N/A
      </span>
    );
  }

  if (!url) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400 dark:border-gray-700 dark:bg-gray-900"
        style={boxStyle}
      >
        …
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-90"
      style={boxStyle}
      title="Open receipt"
    >
      <img
        src={url}
        alt={alt}
        width={width}
        height={height}
        className={className ?? `${DEFAULT_CLASS} h-full w-full`}
      />
    </a>
  );
}
