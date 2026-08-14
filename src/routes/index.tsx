import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Ruler, Sofa, Wand2, Sparkles, ShieldCheck } from "lucide-react";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { images, plans, CONCEPTUAL_NOTE } from "@/lib/archigen-data";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/archigen/theme-toggle";

function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArchiGen AI — Design Buildings & Interiors With AI" },
      {
        name: "description",
        content:
          "ArchiGen AI turns a short brief into architecture renders, interior concepts, room redesigns and editable conceptual floor plans.",
      },
      { property: "og:title", content: "ArchiGen AI — Design Buildings & Interiors With AI" },
      {
        property: "og:description",
        content:
          "From brief to render to editable floor plan — an AI design studio for homes and interiors.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Building2,
    title: "Architecture concepts",
    body: "Describe the plot, floors, style and materials. Get exterior concepts in seconds.",
  },
  {
    icon: Sofa,
    title: "Interior design",
    body: "Room-by-room concepts tuned to style, palette, lighting and budget.",
  },
  {
    icon: Wand2,
    title: "Room redesign",
    body: "Upload a photo of a real room and see it restyled while keeping the layout.",
  },
  {
    icon: Ruler,
    title: "Editable floor plans",
    body: "Conceptual 1–4 BHK layouts stored as structured data, not flat images.",
  },
];

function Landing() {
  const signedIn = useSignedIn();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Ruler className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">ArchiGen AI</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#showcase" className="transition-colors hover:text-foreground">
              Showcase
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!signedIn && (
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
            <Button asChild size="sm">
              <Link to={signedIn ? "/dashboard" : "/auth"}>
                {signedIn ? "Open studio" : "Get started"} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <img
            src={images.heroVilla}
            alt="AI-generated concrete and glass villa at dusk"
            width={1600}
            height={1008}
            className="absolute inset-0 size-full object-cover opacity-70"
          />
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "var(--gradient-dusk)" }}
            aria-hidden="true"
          />
          <div className="blueprint-grid relative mx-auto max-w-6xl px-5 pb-24 pt-28 md:pb-36 md:pt-40">
            <Badge
              variant="outline"
              className="mb-6 border-primary/40 bg-background/60 text-primary"
            >
              <Sparkles className="size-3.5" /> AI design studio
            </Badge>
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.05] md:text-6xl">
              From a sentence to a <span className="text-brass">building concept</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              ArchiGen AI generates architecture renders, interior concepts, room redesigns and
              editable conceptual floor plans — all saved into projects you can revisit and share.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={signedIn ? "/dashboard" : "/auth"}>
                  Start designing free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/gallery">Browse the gallery</Link>
              </Button>
            </div>
            <p className="label-caps mt-10 max-w-md">{CONCEPTUAL_NOTE}</p>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-20">
          <p className="label-caps">What's inside</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold md:text-4xl">
            Four generators, one project workspace
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <article
                key={f.title}
                className="surface-panel p-6 transition-colors hover:border-primary/50"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="showcase" className="border-y border-border bg-card/40 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="label-caps">Showcase</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Generated in the studio</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  src: images.sampleExterior,
                  alt: "Contemporary brick and concrete house facade",
                  label: "Architecture",
                },
                {
                  src: images.sampleInterior,
                  alt: "Warm minimalist living room interior",
                  label: "Interior",
                },
                {
                  src: images.samplePlan,
                  alt: "Conceptual blueprint floor plan",
                  label: "Floor plan",
                },
              ].map((s) => (
                <figure
                  key={s.label}
                  className="group overflow-hidden rounded-xl border border-border"
                >
                  <img
                    src={s.src}
                    alt={s.alt}
                    loading="lazy"
                    width={900}
                    height={700}
                    className="h-60 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <figcaption className="label-caps border-t border-border bg-card px-4 py-3">
                    {s.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
          <p className="label-caps">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
            Credits that match your workload
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <article
                key={p.name}
                className={`surface-panel p-6 ${p.featured ? "border-primary/60 shadow-[var(--shadow-glow)]" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  {p.featured && <Badge>Popular</Badge>}
                </div>
                <p className="mt-4 font-display text-3xl font-bold">
                  {p.price}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    / {p.period}
                  </span>
                </p>
                <p className="mt-1 text-sm text-primary">{p.credits}</p>
                <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-6 w-full"
                  variant={p.featured ? "default" : "outline"}
                >
                  <Link to="/pricing">{p.cta}</Link>
                </Button>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ArchiGen AI</p>
          <p className="max-w-md text-xs">{CONCEPTUAL_NOTE}</p>
        </div>
      </footer>
    </div>
  );
}
