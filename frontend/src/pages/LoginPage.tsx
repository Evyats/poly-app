import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { api } from "../api/client";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

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
            toast.success("Signed in");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Google login failed");
            toast.error("Google login failed");
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
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel subtle-grid rounded-[2rem] p-8 sm:p-10">
          <Badge variant="outline" className="mb-4">
            Secure access
          </Badge>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            PolyApp, redesigned around the shadcn template language.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            A single login unlocks every tracker. The app uses a whitelisted Google sign-in flow and session cookies, so the workspace stays private and consistent across all tools.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card className="bg-background/80">
              <CardHeader className="pb-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground">
                  <ShieldCheck className="size-5" />
                </div>
                <CardTitle>Whitelisted access</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                Only allowed Google accounts can open the app.
              </CardContent>
            </Card>
            <Card className="bg-background/80">
              <CardHeader className="pb-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground">
                  <Lock className="size-5" />
                </div>
                <CardTitle>Session-based auth</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                After sign-in, requests stay authenticated through the backend session cookie.
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="glass-panel rounded-[2rem]">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Login
            </Badge>
            <CardTitle className="text-2xl">Sign in to PolyApp</CardTitle>
            <CardDescription>Use your approved Google account to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!clientId ? (
              <div className="rounded-xl border border-amber-400/60 bg-amber-100/70 p-4 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                Missing <code>VITE_GOOGLE_CLIENT_ID</code> in frontend env.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                  <div ref={buttonRef} className="flex justify-center" />
                </div>
                <Separator />
                <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                  The Google button is loaded directly from Google Identity Services and then exchanged with the backend for an authenticated app session.
                </div>
              </div>
            )}

            {loading ? (
              <Button disabled className="w-full">
                Signing in...
              </Button>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
