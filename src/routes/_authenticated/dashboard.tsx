import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Building2, Ruler, Sofa, Wand2, Coins, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/archigen/generator";
import { tools, creditCosts } from "@/lib/archigen-data";
import { coverFor, relativeTime, useProjects } from "@/hooks/use-projects";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ArchiGen AI" },
      {
        name: "description",
        content: "Your ArchiGen AI studio: recent projects, credits and generators.",
      },
      { property: "og:title", content: "Dashboard — ArchiGen AI" },
      {
        property: "og:description",
        content: "Recent projects, credit balance and every AI generator in one place.",
      },
    ],
  }),
  component: Dashboard,
});

const icons = { Building2, Sofa, Wand2, Ruler } as const;

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: projects = [] } = useProjects();
  const firstName = (profile?.full_name || profile?.email || "designer").split(/[\s@]/)[0];

  return (
    <>
      <PageHeader
        eyebrow="Studio"
        title={`Welcome back, ${firstName}`}
        description="Pick a generator, or continue where you left off."
        actions={
          <Button asChild>
            <Link to="/architecture">
              <Sparkles className="size-4" /> New generation
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Credits left", value: String(profile?.credits ?? 0) },
          { label: "Projects", value: String(projects.length) },
          { label: "Generations", value: "0" },
          { label: "Favorites", value: String(projects.filter((p) => p.is_favorite).length) },
        ].map((s) => (
          <div key={s.label} className="surface-panel p-5">
            <p className="label-caps">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold">Generators</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((t) => {
          const Icon = icons[t.icon as keyof typeof icons];
          return (
            <Link
              key={t.slug}
              to={t.to}
              className="surface-panel group flex items-start gap-4 p-5 transition-colors hover:border-primary/50"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{t.name}</h3>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
                <Badge variant="outline" className="mt-3 text-muted-foreground">
                  <Coins className="size-3.5" /> {t.credits} credits
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent projects</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/projects">View all</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No projects yet —{" "}
                <Link to="/projects" className="text-primary underline">
                  create one
                </Link>
                .
              </p>
            )}
            {projects.slice(0, 4).map((p) => (
              <article key={p.id} className="surface-panel overflow-hidden">
                <img
                  src={coverFor(p)}
                  alt={p.title}
                  loading="lazy"
                  className="h-36 w-full object-cover"
                />
                <div className="p-4">
                  <p className="label-caps">{p.type}</p>
                  <h3 className="mt-1 truncate text-sm font-semibold">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    updated {relativeTime(p.updated_at)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="surface-panel h-fit p-5">
          <h2 className="text-sm font-semibold">Credit costs</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {creditCosts.map((c) => (
              <li key={c.label} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{c.label}</span>
                <span className="font-mono text-primary">{c.cost}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-5 w-full" variant="outline">
            <Link to="/pricing">Buy more credits</Link>
          </Button>
        </aside>
      </div>
    </>
  );
}
