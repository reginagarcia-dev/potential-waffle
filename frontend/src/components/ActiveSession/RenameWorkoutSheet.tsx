import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/Sheet";
import { useModalDialog } from "@/hooks/useModalDialog";

interface RenameWorkoutSheetProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => void;
  isPending?: boolean;
}

export const RenameWorkoutSheet: React.FC<RenameWorkoutSheetProps> = ({
  isOpen,
  currentName,
  onClose,
  onSave,
  isPending = false,
}) => {
  const dialogRef = useModalDialog(isOpen);
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) return;

    onSave(trimmed);
  };

  return (
    <Sheet
      dialogRef={dialogRef}
      onClose={onClose}
      title="Rename Workout"
      subtitle="Give this session a clearer name."
      closeAriaLabel="Close rename workout"
    >
      <form onSubmit={handleSubmit}>
        <div className="px-5 py-5">
          <label
            htmlFor="workout-name"
            className="text-sm font-semibold text-foreground"
          >
            Workout name
          </label>

          <input
            id="workout-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={cn(
              "mt-2 h-12 w-full rounded-xl border border-input bg-surface px-3 text-sm font-semibold text-foreground",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
            )}
            autoFocus
          />
        </div>

        <div className="border-t border-border bg-card px-5 py-4">
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground",
              "transition hover:bg-primary-hover active:bg-primary-pressed",
              "disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring",
            )}
          >
            {isPending ? "Saving..." : "Save Name"}
          </button>
        </div>
      </form>
    </Sheet>
  );
};

export default RenameWorkoutSheet;
