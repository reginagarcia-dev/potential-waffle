import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/Sheet";
import { useModalDialog } from "@/hooks/useModalDialog";

type ConfirmDestructiveSheetProps = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  confirmPendingLabel?: string;
  cancelLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
  closeAriaLabel?: string;
  // DeleteExerciseSheet calls onClose right after onConfirm itself;
  // DiscardWorkoutSheet's caller closes it as part of handling onDiscard.
  // Keeping this explicit avoids guessing which behavior a given caller wants.
  closeAfterConfirm?: boolean;
};

export function ConfirmDestructiveSheet({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmPendingLabel,
  cancelLabel,
  onClose,
  onConfirm,
  isPending = false,
  closeAriaLabel = "Close",
  closeAfterConfirm = false,
}: ConfirmDestructiveSheetProps) {
  const dialogRef = useModalDialog(isOpen);

  return (
    <Sheet
      dialogRef={dialogRef}
      onClose={onClose}
      title={title}
      subtitle={description}
      closeAriaLabel={closeAriaLabel}
      icon={
        <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger">
          <AlertTriangle className="size-5" />
        </div>
      }
    >
      <div className="space-y-3 px-5 py-5">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            onConfirm();
            if (closeAfterConfirm) onClose();
          }}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-xl bg-danger px-4 text-base font-semibold text-primary-foreground",
            "transition hover:bg-danger/90 active:bg-danger/80",
            "disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring",
          )}
        >
          {isPending && confirmPendingLabel ? confirmPendingLabel : confirmLabel}
        </button>

        <button
          type="button"
          onClick={onClose}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground",
            "transition hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring",
          )}
        >
          {cancelLabel}
        </button>
      </div>
    </Sheet>
  );
}
