import { BarChart3, Clock, Home, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Today",
    to: "/",
    icon: Home,
  },
  {
    label: "History",
    to: "/history",
    icon: Clock,
  },
  {
    label: "Progress",
    to: "/progress",
    icon: BarChart3,
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
  },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto h-16 w-full border-t border-border bg-background/95 backdrop-blur">
      <div className="grid h-full grid-cols-4 mx-auto max-w-md ">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 text-muted-foreground transition",
                  isActive && "text-primary",
                )
              }
            >
              <Icon className="size-5" />
              <span className="text-caption font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
