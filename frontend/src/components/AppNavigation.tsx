import { Link, NavLink } from "react-router-dom";
import {
  Activity,
  BookOpenText,
  Dumbbell,
  Home,
  Sparkles,
  Sunrise,
  Weight,
} from "lucide-react";

import type { AuthUser } from "../lib/types";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

export const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/reps", label: "Reps", icon: Dumbbell },
  { to: "/wakeup", label: "Wake-up", icon: Sunrise },
  { to: "/weight", label: "Weight", icon: Weight },
  { to: "/routine", label: "Routine", icon: Activity },
  { to: "/vocab", label: "Vocab", icon: BookOpenText },
];

function getInitials(user: AuthUser) {
  const base = user.email ?? user.username;
  return base
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type AppNavigationProps = {
  user: AuthUser;
  onNavigate?: () => void;
};

export function AppNavigation({ user, onNavigate }: AppNavigationProps) {
  const initials = getInitials(user);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <Sparkles className="size-5" />
        </div>
        <div>
          <Link to="/" className="text-lg font-semibold tracking-tight text-sidebar-foreground" onClick={onNavigate}>
            PolyApp
          </Link>
          <p className="text-xs text-muted-foreground">Personal operating system</p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="rounded-2xl border border-sidebar-border bg-background/80 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback>{initials || "PA"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user.email ?? user.username}</p>
              <p className="truncate text-xs text-muted-foreground">Signed in</p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-sidebar-border/80" />

      <div className="flex-1 px-3 py-4">
        <div className="mb-3 px-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Trackers</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  ].join(" ")
                }
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="px-4 pb-4">
        <div className="rounded-2xl border border-sidebar-border bg-background/80 p-4">
          <Badge variant="outline" className="mb-3">
            Active workspace
          </Badge>
          <p className="text-sm font-medium text-sidebar-foreground">Unified controls and surfaces across all trackers.</p>
        </div>
      </div>
    </div>
  );
}
