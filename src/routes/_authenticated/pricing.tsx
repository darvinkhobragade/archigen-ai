import { createFileRoute } from "@tanstack/react-router";
import { Check, Coins, ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/archigen/generator";
import { plans, creditCosts } from "@/lib/archigen-data";
import { useProfile } from "@/hooks/use-profile";
import {
  useCreditHistory,
  summarize,
  formatWhen,
  LOW_CREDIT_THRESHOLD,
  useCreatePaymentOrder,
  useVerifyPayment,
} from "@/hooks/use-credits";

export const Route = createFileRoute("/_authenticated/pricing")({
  head: () => ({
    meta: [
      { title: "Credits & Plans — ArchiGen AI" },
      {
        name: "description",
        content:
          "ArchiGen AI credit packs and subscription plans for students, studios and practices.",
      },
      { property: "og:title", content: "Credits & Plans — ArchiGen AI" },
      {
        property: "og:description",
        content: "Choose a credit plan that matches your design workload.",
      },
    ],
  }),
  component: PricingPage,
});

const packs = [
  { credits: 100, price: "₹99", amount: 99 },
  { credits: 500, price: "₹399", amount: 399 },
  { credits: 1500, price: "₹999", amount: 999 },
];

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function PricingPage() {
  const { data: profile } = useProfile();
  const { data: history, isLoading: historyLoading } = useCreditHistory();
  const createOrder = useCreatePaymentOrder();
  const verifyPayment = useVerifyPayment();

  const credits = profile?.credits ?? 0;
  const stats = summarize(history);
  const lifetime = credits + stats.spentAllTime;
  const usedPct =
    lifetime > 0 ? Math.min(100, Math.round((stats.spentAllTime / lifetime) * 100)) : 0;
  const low = credits < LOW_CREDIT_THRESHOLD;

  const handleCheckout = async (
    packTitle: string,
    amountInRupees: number,
    creditsToAdd: number,
  ) => {
    try {
      const order = await createOrder.mutateAsync({
        amountInRupees,
        credits: creditsToAdd,
        packTitle,
      });

      if (order.isTestMode) {
        toast.info("Test Mode: Simulating Razorpay Payment...");
        const res = await verifyPayment.mutateAsync({
          orderId: order.orderId,
          paymentId: `pay_test_${Date.now()}`,
          signature: "test_mode_sig",
          credits: creditsToAdd,
          packTitle,
        });
        if (res.success) {
          toast.success(`Purchased ${packTitle}! Added ${creditsToAdd} credits.`);
        }
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        toast.error("Failed to load Razorpay payment SDK.");
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ArchiGen AI Studio",
        description: `Purchase ${packTitle}`,
        order_id: order.orderId,
        prefill: {
          name: profile?.full_name || "",
          email: profile?.email || "",
        },
        handler: async (response: RazorpayResponse) => {
          const verified = await verifyPayment.mutateAsync({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            credits: creditsToAdd,
            packTitle,
          });
          if (verified.success) {
            toast.success(`Payment successful! ${creditsToAdd} credits added.`);
          }
        },
        theme: { color: "#3b82f6" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment checkout failed.";
      toast.error(msg);
    }
  };

  const isPending = createOrder.isPending || verifyPayment.isPending;

  return (
    <>
      <PageHeader
        eyebrow="Billing"
        title="Credits & Plans"
        description="Pay per generation or subscribe monthly."
      />

      <div className="surface-panel mb-8 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-caps">Balance</p>
            <p className="mt-1 font-display text-4xl font-bold text-primary">{credits} credits</p>
          </div>
          <Badge
            variant={low ? "destructive" : "outline"}
            className={low ? "" : "text-muted-foreground"}
          >
            {low ? "Low balance — top up soon" : `${stats.spentThisMonth} used this month`}
          </Badge>
        </div>
        <Progress value={usedPct} className="mt-5" />
        <p className="mt-2 text-xs text-muted-foreground">
          {stats.spentAllTime} of {lifetime} credits used all time · {stats.generations} paid
          actions
        </p>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Top-up packs</h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {packs.map((p) => (
          <div key={p.credits} className="surface-panel flex items-center justify-between p-5">
            <div>
              <p className="flex items-center gap-2 font-semibold">
                <Coins className="size-4 text-primary" /> {p.credits} credits
              </p>
              <p className="text-sm text-muted-foreground">{p.price}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleCheckout(`${p.credits} Credits Pack`, p.amount, p.credits)}
            >
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : `Buy for ${p.price}`}
            </Button>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold">Subscriptions</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const numPrice = parseInt(p.price.replace(/[^\d]/g, ""), 10) || 499;
          const numCredits = parseInt(p.credits.replace(/[^\d]/g, ""), 10) || 600;
          return (
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
                <span className="ml-1 text-sm font-normal text-muted-foreground">/ {p.period}</span>
              </p>
              <p className="mt-1 text-sm text-primary">{p.credits}</p>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={p.featured ? "default" : "outline"}
                disabled={isPending}
                onClick={() => handleCheckout(`${p.name} Plan`, numPrice, numCredits)}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : p.cta}
              </Button>
            </article>
          );
        })}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold">What each action costs</h2>
      <div className="surface-panel divide-y divide-border">
        {creditCosts.map((c) => (
          <div key={c.label} className="flex items-center justify-between px-5 py-3 text-sm">
            <span className="text-muted-foreground">{c.label}</span>
            <span className="font-mono text-primary">{c.cost} credits</span>
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold">Credit history</h2>
      <div className="surface-panel divide-y divide-border">
        {historyLoading ? (
          <div className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading history…
          </div>
        ) : (history?.length ?? 0) === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">No credit activity yet.</p>
        ) : (
          history!.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate capitalize">{t.reason}</p>
                <p className="text-xs text-muted-foreground">{formatWhen(t.created_at)}</p>
              </div>
              <span
                className={`flex items-center gap-1 font-mono ${t.amount < 0 ? "text-muted-foreground" : "text-accent"}`}
              >
                {t.amount < 0 ? (
                  <ArrowDownRight className="size-3.5" />
                ) : (
                  <ArrowUpRight className="size-3.5" />
                )}
                {t.amount > 0 ? "+" : ""}
                {t.amount}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
