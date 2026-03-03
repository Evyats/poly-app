import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { api } from "./api/client";
import { Layout } from "./components/Layout";
import type { AuthUser } from "./lib/types";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RepsTrackerPage } from "./pages/RepsTrackerPage";
import { RoutineTrackerPage } from "./pages/RoutineTrackerPage";
import { WakeupTrackerPage } from "./pages/WakeupTrackerPage";
import { WeightTrackerPage } from "./pages/WeightTrackerPage";

type MeResponse = {
  authenticated: boolean;
  user: AuthUser;
};

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("polyapp-theme");
    return stored === "dark" ? "dark" : "light";
  });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem("polyapp-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const refreshAuth = useCallback(async () => {
    try {
      const me = await api.get<MeResponse>("/api/auth/me");
      setUser(me.user);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  }, []);

  if (authLoading) {
    return <p className="p-6">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-slate-950">
        <LoginPage onLoggedIn={refreshAuth} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout
              theme={theme}
              onToggleTheme={() => setTheme((v) => (v === "light" ? "dark" : "light"))}
              user={user}
              onLogout={logout}
            />
          }
        >
          <Route index element={<HomePage />} />
          <Route path="reps" element={<RepsTrackerPage />} />
          <Route path="wakeup" element={<WakeupTrackerPage />} />
          <Route path="weight" element={<WeightTrackerPage />} />
          <Route path="routine" element={<RoutineTrackerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
