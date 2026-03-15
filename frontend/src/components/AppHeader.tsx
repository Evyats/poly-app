import { DoorOpen, Menu, Moon, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";

import type { AuthUser } from "../lib/types";
import { navItems } from "./AppNavigation";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type AppHeaderProps = {
  theme: "light" | "dark";
  user: AuthUser;
  onOpenMobileNav: () => void;
  onToggleTheme: () => void;
  onLogout: () => Promise<void>;
};

function getInitials(user: AuthUser) {
  const base = user.email ?? user.username;
  return base
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppHeader({ theme, user, onOpenMobileNav, onToggleTheme, onLogout }: AppHeaderProps) {
  const location = useLocation();
  const initials = getInitials(user);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={onOpenMobileNav}>
            <Menu className="size-4" />
          </Button>
          <div>
            <p className="text-sm font-medium text-foreground">
              {navItems.find((item) => item.to === location.pathname)?.label ?? "PolyApp"}
            </p>
            <p className="text-xs text-muted-foreground">Unified tracker workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToggleTheme} className="hidden sm:inline-flex">
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            {theme === "light" ? "Dark" : "Light"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 gap-3 rounded-full pl-2 pr-3">
                <Avatar className="size-7">
                  <AvatarFallback>{initials || "PA"}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-40 truncate sm:inline">{user.email ?? user.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <DropdownMenuItem onClick={onToggleTheme}>
                {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                Toggle {theme === "light" ? "dark" : "light"} mode
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Session</DropdownMenuLabel>
              <DropdownMenuItem onClick={onLogout}>
                <DoorOpen className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
