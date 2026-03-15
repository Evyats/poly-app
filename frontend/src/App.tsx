import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { api } from "./api/client";
import { LoadingView } from "./components/LoadingView";
import { Layout } from "./components/Layout";
import type { AuthUser } from "./lib/types";
import { LoginPage } from "./pages/LoginPage";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const RepsTrackerPage = lazy(() => import("./pages/RepsTrackerPage").then((module) => ({ default: module.RepsTrackerPage })));
const RoutineTrackerPage = lazy(() => import("./pages/RoutineTrackerPage").then((module) => ({ default: module.RoutineTrackerPage })));
const WakeupTrackerPage = lazy(() => import("./pages/WakeupTrackerPage").then((module) => ({ default: module.WakeupTrackerPage })));
const VocabTrainerPage = lazy(() => import("./pages/VocabTrainerPage").then((module) => ({ default: module.VocabTrainerPage })));
const WeightTrackerPage = lazy(() => import("./pages/WeightTrackerPage").then((module) => ({ default: module.WeightTrackerPage })));

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="glass-panel rounded-3xl px-8 py-6">
          <p className="text-sm text-muted-foreground">Loading PolyApp...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen px-4 py-8">
        <LoginPage onLoggedIn={refreshAuth} />
        <Toaster richColors position="top-right" theme={theme} />
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
          <Route
            index
            element={
              <Suspense fallback={<LoadingView label="Loading page..." />}>
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path="reps"
            element={
              <Suspense fallback={<LoadingView label="Loading page..." />}>
                <RepsTrackerPage />
              </Suspense>
            }
          />
          <Route
            path="wakeup"
            element={
              <Suspense fallback={<LoadingView label="Loading page..." />}>
                <WakeupTrackerPage />
              </Suspense>
            }
          />
          <Route
            path="weight"
            element={
              <Suspense fallback={<LoadingView label="Loading page..." />}>
                <WeightTrackerPage />
              </Suspense>
            }
          />
          <Route
            path="routine"
            element={
              <Suspense fallback={<LoadingView label="Loading page..." />}>
                <RoutineTrackerPage />
              </Suspense>
            }
          />
          <Route
            path="vocab"
            element={
              <Suspense fallback={<LoadingView label="Loading page..." />}>
                <VocabTrainerPage />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" theme={theme} />
    </BrowserRouter>
  );
}

export default App;

