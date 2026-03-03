import { Link, NavLink, Outlet } from "react-router-dom";
import type { AuthUser } from "../lib/types";

type LayoutProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  user: AuthUser;
  onLogout: () => Promise<void>;
};

const navItems = [
  { to: "/", label: "Home" },
  { to: "/reps", label: "Reps" },
  { to: "/wakeup", label: "Wake-up" },
  { to: "/weight", label: "Weight" },
  { to: "/routine", label: "Routine" },
];

export function Layout({ theme, onToggleTheme, user, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-xl font-bold tracking-tight text-cyan-600 dark:text-cyan-300">
            PolyApp
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-full px-3 py-1.5 transition",
                    isActive
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={onToggleTheme}
              className="rounded-full border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {theme === "light" ? "Dark" : "Light"}
            </button>
            <span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs dark:bg-slate-800">
              {user.email ?? user.username}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-5">
        <Outlet />
      </main>
    </div>
  );
}
