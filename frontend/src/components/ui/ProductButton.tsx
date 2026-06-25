import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ProductButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ProductButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ProductButtonVariant;
  fullWidth?: boolean;
};

const variants: Record<ProductButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-muted/60",
  ghost: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
  danger: "bg-danger text-white hover:bg-danger/90 active:bg-danger/80",
};

export function ProductButton({
  className,
  variant = "primary",
  fullWidth = false,
  ...props
}: ProductButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-lg px-4 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        fullWidth && "w-full",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
