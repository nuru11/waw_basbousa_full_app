import { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

const Label: FC<LabelProps> = ({ htmlFor, children, className }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={clsx(
        twMerge(
          "mb-2 block text-sm font-semibold text-gray-700 md:text-base dark:text-gray-300",
          className
        )
      )}
    >
      {children}
    </label>
  );
};

export default Label;
