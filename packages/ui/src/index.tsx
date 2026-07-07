import type { CSSProperties, ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "discount" | "primary";
  className?: string;
}

export function Badge({ children, variant = "primary", className = "" }: BadgeProps) {
  const styles: Record<string, CSSProperties> = {
    discount: { backgroundColor: "#FF424F", color: "#fff" },
    primary: { backgroundColor: "#1E4FFF", color: "#fff" },
  };

  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold ${className}`}
      style={styles[variant]}
    >
      {children}
    </span>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary: "bg-[#1E4FFF] text-white hover:bg-[#003DD6]",
    outline: "border-2 border-[#1E4FFF] text-[#1E4FFF] hover:bg-blue-50",
    danger: "bg-[#FF424F] text-white hover:bg-red-600",
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function formatPrice(amount: number): string {
  return `฿${amount.toLocaleString("th-TH")}`;
}
