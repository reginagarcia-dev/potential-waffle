import React from "react";
import { ConfirmDestructiveSheet } from "./ConfirmDestructiveSheet";

interface DiscardWorkoutSheetProps {
  isOpen: boolean;
  workoutName?: string;
  onClose: () => void;
  onDiscard: () => void;
  isPending?: boolean;
}

export const DiscardWorkoutSheet: React.FC<DiscardWorkoutSheetProps> = ({
  isOpen,
  workoutName,
  onClose,
  onDiscard,
  isPending = false,
}) => (
  <ConfirmDestructiveSheet
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onDiscard}
    isPending={isPending}
    closeAriaLabel="Close discard workout"
    title="Discard Workout?"
    description={
      <>
        This will delete{" "}
        <span className="font-semibold text-foreground">
          {workoutName || "this workout"}
        </span>{" "}
        and all logged sets.
      </>
    }
    confirmLabel="Discard Workout"
    confirmPendingLabel="Discarding..."
    cancelLabel="Keep Logging"
  />
);

export default DiscardWorkoutSheet;
