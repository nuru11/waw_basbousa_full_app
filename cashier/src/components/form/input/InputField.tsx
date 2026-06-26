import type React from "react";
import type { FC } from "react";

interface InputProps {
  type?: string;
  id?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string;
  step?: string;
  disabled?: boolean;
  error?: boolean;
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  placeholder,
  value,
  onChange,
  className = "",
  min,
  step,
  disabled = false,
  error = false,
}) => {
  let inputClasses = `h-12 w-full rounded-xl border appearance-none px-4 py-3 text-base shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${className}`;

  if (disabled) {
    inputClasses +=
      " text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  } else if (error) {
    inputClasses +=
      " border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500";
  } else {
    inputClasses +=
      " bg-white text-gray-800 border-gray-200 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800";
  }

  return (
    <input
      type={type}
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      min={min}
      step={step}
      disabled={disabled}
      className={inputClasses}
    />
  );
};

export default Input;
