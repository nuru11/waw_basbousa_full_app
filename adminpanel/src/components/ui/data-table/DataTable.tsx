import type { ReactNode } from "react";
import { cn } from "../../../utils/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../table";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: ReactNode;
  hoverRows?: boolean;
  className?: string;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage,
  hoverRows = false,
  className,
}: DataTableProps<T>) {
  if (data.length === 0 && emptyMessage) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]",
        className
      )}
    >
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  isHeader
                  className={cn(
                    "px-5 py-3 text-start font-medium text-theme-xs text-gray-500 dark:text-gray-400",
                    col.headerClassName
                  )}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={keyExtractor(row)}
                className={cn(
                  "border-b border-gray-100 dark:border-white/[0.05]",
                  hoverRows && "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      "px-5 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-300",
                      col.cellClassName
                    )}
                  >
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
