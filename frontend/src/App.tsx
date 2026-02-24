import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { RepsTrackerPage } from "./pages/RepsTrackerPage";
import { RoutineTrackerPage } from "./pages/RoutineTrackerPage";
import { WakeupTrackerPage } from "./pages/WakeupTrackerPage";
import { WeightTrackerPage } from "./pages/WeightTrackerPage";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("polyapp-theme");
    return stored === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("polyapp-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout theme={theme} onToggleTheme={() => setTheme((v) => (v === "light" ? "dark" : "light"))} />}>
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
