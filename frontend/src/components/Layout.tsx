import { useState } from "react";
import { Outlet } from "react-router-dom";

import type { AuthUser } from "../lib/types";
import { AppHeader } from "./AppHeader";
import { AppNavigation } from "./AppNavigation";

type LayoutProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  user: AuthUser;
  onLogout: () => Promise<void>;
};

export function Layout({ theme, onToggleTheme, user, onLogout }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen app-shell-gradient">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="hidden w-80 shrink-0 border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl lg:block">
          <AppNavigation user={user} />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[19rem] border-r border-sidebar-border bg-sidebar shadow-2xl">
              <AppNavigation user={user} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            theme={theme}
            user={user}
            onOpenMobileNav={() => setMobileOpen(true)}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
          />

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
