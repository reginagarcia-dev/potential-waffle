import { cn } from "@/lib/utils";

type BinaryOption<T extends string> = {
  label: string;
  value: T;
};

type BinaryToggleProps<T extends string> = {
  value: T;
  left: BinaryOption<T>;
  right: BinaryOption<T>;
  onChange: (value: T) => void;
  className?: string;
};

export function BinaryToggle<T extends string>({
  value,
  left,
  right,
  onChange,
  className,
}: BinaryToggleProps<T>) {
  const options = [left, right];

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={cn(
              "h-10 rounded-lg border text-sm font-semibold transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
