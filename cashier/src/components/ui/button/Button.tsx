import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline" | "success" | "sky";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) => {
  const sizeClasses = {
    sm: "px-4 py-3 text-sm min-h-11",
    md: "px-5 py-3.5 text-sm min-h-12",
    lg: "px-6 py-4 text-base font-semibold min-h-14",
  };

  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-300",
    sky: "bg-pos-sky-500 text-white shadow-theme-sm hover:bg-pos-sky-600 active:bg-pos-sky-700 disabled:bg-pos-sky-300",
    success:
      "bg-pos-emerald-500 text-white shadow-theme-sm hover:bg-pos-emerald-600 active:bg-pos-emerald-700 disabled:bg-pos-emerald-300",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 active:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition touch-manipulation ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
