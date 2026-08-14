import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Ruler } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type AuthSearch = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — ArchiGen AI Studio" },
      {
        name: "description",
        content:
          "Sign in or create your ArchiGen AI account to generate architecture, interiors and conceptual floor plans.",
      },
      { property: "og:title", content: "Sign in — ArchiGen AI Studio" },
      {
        property: "og:description",
        content: "Access your AI architecture and interior design studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function safePath(path: string | undefined) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  return path;
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const destination = safePath(search.redirect);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: destination, replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: destination, replace: true });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [destination, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          toast.success("Check your inbox to confirm your email.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-12">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Ruler className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold">ArchiGen AI</span>
        </Link>

        <div className="surface-panel p-6 md:p-8">
          <h1 className="font-display text-2xl font-bold">
            {mode === "signin" ? "Welcome back" : "Create your studio"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to continue your designs."
              : "New accounts start with 20 free credits."}
          </p>

          {checkEmail ? (
            <p className="mt-6 rounded-md border border-primary/30 bg-primary/10 p-4 text-sm">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
              studio, then sign in.
            </p>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Aditya Kapoor"
                      autoComplete="name"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "New to ArchiGen AI?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          AI outputs are conceptual visualisations, not construction-ready drawings.
        </p>
      </div>
    </main>
  );
}
