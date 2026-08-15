import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Coins,
  LayoutDashboard,
  MessageSquare,
  Ruler,
  Settings,
  Sofa,
  FolderKanban,
  Wand2,
  Menu,
  LogOut,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, initials } from "@/hooks/use-profile";
import { useAppSettings } from "@/hooks/use-app-settings";
import { ThemeToggle } from "@/components/archigen/theme-toggle";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  component: AppLayout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/architecture", label: "Architecture", icon: Building2 },
  { to: "/interior", label: "Interior", icon: Sofa },
  { to: "/redesign", label: "Room Redesign", icon: Wand2 },
  { to: "/floor-plan", label: "Floor Plan", icon: Ruler },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/assistant", label: "AI Assistant", icon: MessageSquare },
  { to: "/pricing", label: "Credits & Plans", icon: Coins },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            }`}
          >
            <item.icon className={`size-4 ${active ? "text-primary" : ""}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 px-1">
      <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <Ruler className="size-4" />
      </span>
      <span className="font-display text-base font-semibold">ArchiGen AI</span>
    </Link>
  );
}

function AppLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { settings } = useAppSettings();
  const credits = profile?.credits ?? 0;
  const showLowCreditWarning = settings.lowCreditAlerts && credits < 20;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Brand />
        <div className="mt-8 flex-1">
          <NavList />
        </div>
        <div className="surface-panel bg-secondary/40 p-4">
          <p className="label-caps">Credits</p>
          <p
            className={`mt-1 font-display text-2xl font-bold ${showLowCreditWarning ? "text-destructive" : "text-primary"}`}
          >
            {credits}
          </p>
          {showLowCreditWarning && (
            <p className="mt-1 text-xs text-destructive font-medium">
              Running low (&lt;20 credits) — top up to keep generating.
            </p>
          )}
          <Button asChild size="sm" variant="outline" className="mt-3 w-full">
            <Link to="/pricing">Buy credits</Link>
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-4">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Brand />
                <div className="mt-8">
                  <NavList onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-display text-sm font-semibold lg:hidden">ArchiGen AI</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Badge
              variant="outline"
              className={
                showLowCreditWarning
                  ? "border-destructive/50 text-destructive"
                  : "border-primary/40 text-primary"
              }
            >
              <Coins className="size-3.5" /> {credits} credits
            </Badge>
            <span
              className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold"
              title={profile?.email ?? undefined}
            >
              {initials(profile)}
            </span>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
