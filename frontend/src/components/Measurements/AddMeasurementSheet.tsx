import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/Sheet";
import { useModalDialog } from "@/hooks/useModalDialog";
import { MeasurementInput } from "shared";

interface AddMeasurementSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: MeasurementInput) => void;
  isPending?: boolean;
  // Pre-fills the type when opened from an existing type's detail view;
  // omitted when opened from the top-level "+" (user picks or types one).
  initialType?: string;
}

const QUICK_TYPES = ["Body Weight", "Waist", "Chest", "Hips", "Thigh", "Arm"];
const UNITS = ["lbs", "kg", "cm", "in"] as const;

function todayDateInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export const AddMeasurementSheet: React.FC<AddMeasurementSheetProps> = ({
  isOpen,
  onClose,
  onSave,
  isPending = false,
  initialType,
}) => {
  const dialogRef = useModalDialog(isOpen);
  const [type, setType] = useState(initialType ?? "");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<(typeof UNITS)[number]>("lbs");
  const [date, setDate] = useState(todayDateInputValue());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setType(initialType ?? "");
    setValue("");
    setUnit("lbs");
    setDate(todayDateInputValue());
    setError(null);
  }, [isOpen, initialType]);

  const handleSave = () => {
    const trimmedType = type.trim();
    const numericValue = Number(value);

    if (!trimmedType) {
      setError("Enter a measurement type.");
      return;
    }
    if (!value || Number.isNaN(numericValue) || numericValue <= 0) {
      setError("Enter a value greater than 0.");
      return;
    }

    setError(null);
    onSave({
      type: trimmedType,
      value: numericValue,
      unit,
      date: new Date(`${date}T00:00:00`).toISOString(),
    });
  };

  return (
    <Sheet
      dialogRef={dialogRef}
      onClose={onClose}
      title="Log a Measurement"
      subtitle="Track body weight, waist, or any metric you want."
      closeAriaLabel="Close add measurement"
    >
      <div className="space-y-4 px-5 py-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Type
          </label>
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g. Body Weight"
            className="h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {!initialType && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_TYPES.map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setType(quick)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                    type === quick
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {quick}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Value
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              className="h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date
            </label>
            <input
              type="date"
              value={date}
              max={todayDateInputValue()}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unit
          </label>
          <div className="grid grid-cols-4 gap-2">
            {UNITS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setUnit(option)}
                className={cn(
                  "h-10 rounded-xl border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ring",
                  unit === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs font-medium text-danger">{error}</p>}
      </div>

      <div className="border-t border-border bg-card px-5 py-4">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground",
            "transition hover:bg-primary-hover active:bg-primary-pressed",
            "disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring",
          )}
        >
          {isPending ? "Saving..." : "Save Measurement"}
        </button>
      </div>
    </Sheet>
  );
};

export default AddMeasurementSheet;
