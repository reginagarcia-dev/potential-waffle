import { cn } from "@/lib/utils";

type SpinnerVariant = "page" | "fullscreen" | "inline" | "button";

const WRAPPER_CLASSES: Record<SpinnerVariant, string> = {
  page: "flex h-[70vh] items-center justify-center",
  fullscreen:
    "flex h-screen w-screen items-center justify-center bg-background text-primary",
  inline: "flex flex-1 items-center justify-center py-20 text-primary",
  button: "",
};

const CIRCLE_CLASSES: Record<SpinnerVariant, string> = {
  page: "size-8 animate-spin rounded-full border-4 border-primary border-t-transparent",
  fullscreen:
    "size-8 animate-spin rounded-full border-4 border-t-transparent border-primary",
  inline:
    "size-8 animate-spin rounded-full border-4 border-t-transparent border-primary",
  button:
    "size-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent",
};

type SpinnerProps = {
  variant?: SpinnerVariant;
  className?: string;
};

export function Spinner({ variant = "page", className }: SpinnerProps) {
  const circle = <div className={CIRCLE_CLASSES[variant]} />;

  if (variant === "button") {
    return circle;
  }

  return (
    <div className={cn(WRAPPER_CLASSES[variant], className)}>{circle}</div>
  );
}
