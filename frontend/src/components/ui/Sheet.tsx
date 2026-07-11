import type { ReactNode, RefObject } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type SheetProps = {
  // Created by the caller via useModalDialog — kept as a prop (not owned
  // internally) so a sheet can still reach its own dialog element directly
  // when it needs to (e.g. SetEditSheet force-closing when its target set
  // disappears out from under it).
  dialogRef: RefObject<HTMLDialogElement | null>;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  // Leading icon next to the title (e.g. the danger triangle on confirm sheets).
  icon?: ReactNode;
  closeAriaLabel?: string;
  // For sheets whose body can exceed the viewport (e.g. a scrollable list or
  // long form) — caps height and lets the body scroll instead of the sheet.
  scrollableBody?: boolean;
  widthClassName?: string;
  // ExerciseSearchSheet's header has no divider and tighter padding than the
  // rest — kept configurable rather than forced to match, per-sheet.
  headerDivider?: boolean;
  headerPaddingXClassName?: string;
  children: ReactNode;
};

export function Sheet({
  dialogRef,
  onClose,
  title,
  subtitle,
  icon,
  closeAriaLabel = "Close",
  scrollableBody = false,
  widthClassName = "w-[min(100%-2rem,26rem)]",
  headerDivider = true,
  headerPaddingXClassName = "px-5",
  children,
}: SheetProps) {
  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        widthClassName,
        "m-auto max-w-md rounded-2xl border border-border bg-card p-0 text-foreground shadow-elevated",
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        scrollableBody && "max-h-[85dvh]",
        "overflow-hidden focus:outline-none",
      )}
    >
      <div className={scrollableBody ? "flex max-h-[85dvh] flex-col" : undefined}>
        <div className={cn(headerPaddingXClassName, "pt-4")}>
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />

          <div
            className={cn(
              "flex items-start justify-between gap-4",
              headerDivider && "border-b border-border pb-4",
            )}
          >
            <div className={icon ? "flex gap-3" : undefined}>
              {icon}
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={closeAriaLabel}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {children}
      </div>
    </dialog>
  );
}
