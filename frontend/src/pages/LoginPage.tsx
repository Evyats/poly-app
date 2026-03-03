import { useEffect, useMemo, useRef, useState } from "react";

import { api } from "../api/client";

type LoginPageProps = {
  onLoggedIn: () => Promise<void>;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const clientId = useMemo(() => import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined, []);

  useEffect(() => {
    if (!clientId || !buttonRef.current) {
      return;
    }

    const scriptId = "google-identity-services";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    const renderGoogleButton = () => {
      if (!window.google || !buttonRef.current) {
        return;
      }

      buttonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            setLoading(true);
            setError(null);
            await api.post("/api/auth/google", { credential });
            await onLoggedIn();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Google login failed");
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 280,
      });
      window.google.accounts.id.prompt();
    };

    if (existing) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
  }, [clientId, onLoggedIn]);

  return (
    <section className="mx-auto mt-16 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h1 className="text-3xl font-bold">Sign in to PolyApp</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Access is restricted to whitelisted Google accounts.
      </p>

      {!clientId ? (
        <p className="mt-6 rounded-md border border-amber-400 bg-amber-100 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          Missing <code>VITE_GOOGLE_CLIENT_ID</code> in frontend env.
        </p>
      ) : (
        <div className="mt-8 flex justify-center">
          <div ref={buttonRef} />
        </div>
      )}

      {loading && <p className="mt-4 text-sm text-slate-500">Signing in...</p>}
      {error && (
        <p className="mt-4 rounded-md border border-rose-400 bg-rose-100 p-3 text-sm text-rose-900 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-100">
          {error}
        </p>
      )}
    </section>
  );
}
