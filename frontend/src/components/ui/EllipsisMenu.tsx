import { MoreHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type EllipsisMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
};

type EllipsisMenuProps = {
  items: EllipsisMenuItem[];
  ariaLabel?: string;
  title?: string;
  subtitle?: string;
  align?: "left" | "right";
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
};

export function EllipsisMenu({
  items,
  ariaLabel = "Open menu",
  title,
  subtitle,
  align = "right",
  className,
  buttonClassName,
  menuClassName,
}: EllipsisMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;

      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition",
          "hover:bg-muted/50 hover:text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          open && "bg-muted/50 text-foreground",
          buttonClassName,
        )}
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-2 min-w-52 rounded-xl border border-border bg-card p-2 shadow-elevated",
            align === "right" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          {title || subtitle ? (
            <div className="px-3 pb-2 pt-2">
              {title ? (
                <p className="text-sm font-semibold text-foreground">{title}</p>
              ) : null}

              {subtitle ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1">
            {items.map((item) => (
              <MenuItem
                key={item.label}
                item={item}
                onSelect={() => {
                  if (item.disabled) return;

                  item.onClick?.();
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  item,
  onSelect,
}: {
  item: EllipsisMenuItem;
  onSelect: () => void;
}) {
  return (
    <>
      {item.separatorBefore ? (
        <div className="my-1 border-t border-border" />
      ) : null}

      <button
        type="button"
        role="menuitem"
        disabled={item.disabled}
        onClick={onSelect}
        className={cn(
          "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition",
          item.destructive
            ? "text-danger hover:bg-danger/10"
            : "text-foreground hover:bg-muted/50",
          item.disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {item.icon ? (
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center",
              item.destructive ? "text-danger" : "text-muted-foreground",
            )}
          >
            {item.icon}
          </span>
        ) : null}

        <span className="truncate">{item.label}</span>
      </button>
    </>
  );
}
