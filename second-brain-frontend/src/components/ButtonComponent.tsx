import { type LucideIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

type ButtonComponentProps = {
  title?: string;
  icon?: LucideIcon;
  iconColor?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};

const ButtonComponent = ({
  title,
  icon: Icon,
  iconColor,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
}: ButtonComponentProps) => {
  const variantStyles = {
    primary:
      "bg-indigo text-white hover:bg-indigo-deep",

    secondary:
      "bg-white border border-line text-ink hover:border-[#D8D3C4]",

    ghost:
      "bg-transparent text-ink hover:bg-paper",
  };

  const sizeStyles = {
    sm: "px-3 py-2 text-sm gap-2",
    md: "px-4 py-3 text-[14px] gap-2.5",
    lg: "px-5 py-4 text-base gap-3",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        twMerge(
        "flex items-center justify-center rounded-[8px] font-sans font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed", variantStyles[variant], sizeStyles[size], className)}
    >
      {Icon && <Icon size={18} color={iconColor}/>}

      {title && <span>{title}</span>}
    </button>
  );
};

export default ButtonComponent;