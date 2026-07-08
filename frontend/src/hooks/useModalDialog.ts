import { useEffect, useRef } from "react";

interface UseModalDialogOptions {
  /** Call onClose when the user clicks the backdrop outside the dialog box. */
  closeOnBackdropClick?: boolean;
  onClose?: () => void;
}

/**
 * Drives a native <dialog> from React state.
 *
 * Handles showModal/close syncing, optional backdrop-click dismissal, and —
 * critically — closing the dialog when the component unmounts: an orphaned
 * open modal leaves the whole document inert (the page looks frozen), e.g.
 * when a route change unmounts a sheet that is still open.
 */
export function useModalDialog(
  isOpen: boolean,
  { closeOnBackdropClick = false, onClose }: UseModalDialogOptions = {},
) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Keep the native dialog in sync with React state.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Close on unmount so the document can never be left inert.
  useEffect(() => {
    return () => {
      const dialog = dialogRef.current;
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!closeOnBackdropClick) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;

      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.bottom &&
        rect.left <= event.clientX &&
        event.clientX <= rect.right;

      if (!inside) {
        onCloseRef.current?.();
      }
    };

    dialog.addEventListener("click", handleBackdropClick);
    return () => dialog.removeEventListener("click", handleBackdropClick);
  }, [closeOnBackdropClick]);

  return dialogRef;
}
