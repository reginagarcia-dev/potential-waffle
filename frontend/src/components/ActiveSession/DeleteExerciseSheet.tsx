import React from "react";
import { ConfirmDestructiveSheet } from "./ConfirmDestructiveSheet";

interface DeleteExerciseSheetProps {
  isOpen: boolean;
  exerciseName?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteExerciseSheet: React.FC<DeleteExerciseSheetProps> = ({
  isOpen,
  exerciseName,
  onClose,
  onConfirm,
}) => (
  <ConfirmDestructiveSheet
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    closeAfterConfirm
    title="Remove Exercise?"
    description={
      <>
        This will remove{" "}
        <span className="font-semibold text-foreground">
          {exerciseName || "this exercise"}
        </span>{" "}
        and all its logged sets.
      </>
    }
    confirmLabel="Remove Exercise"
    cancelLabel="Keep Exercise"
  />
);

export default DeleteExerciseSheet;
