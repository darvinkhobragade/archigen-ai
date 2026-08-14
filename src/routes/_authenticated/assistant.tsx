import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/archigen/generator";
import { toast } from "sonner";
import { useAskAssistant } from "@/hooks/use-generate";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — ArchiGen AI" },
      {
        name: "description",
        content:
          "Ask the ArchiGen assistant about layouts, materials, vastu, budgets and design briefs.",
      },
      { property: "og:title", content: "AI Assistant — ArchiGen AI" },
      {
        property: "og:description",
        content: "A design co-pilot for layouts, materials and budgets.",
      },
    ],
  }),
  component: AssistantPage,
});

type Message = { role: "user" | "assistant"; content: string };

const seed: Message[] = [
  {
    role: "assistant",
    content:
      "Hi! Tell me about your plot, budget or the room you're planning and I'll suggest a direction.",
  },
];

const suggestions = [
  "Best layout for a 30x40 north-facing plot?",
  "Warm minimal palette under ₹4 lakh",
  "How wide should a corridor be?",
];

function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(seed);
  const [input, setInput] = useState("");
  const ask = useAskAssistant();
  const { data: creditProfile } = useProfile();
  const canAsk = (creditProfile?.credits ?? 0) >= 1;

  const send = async (text: string) => {
    if (!text.trim() || ask.isPending) return;
    if (!canAsk) {
      toast.error("Not enough credits", { description: "Each reply costs 1 credit." });
      return;
    }
    const next: Message[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    try {
      const { reply } = await ask.mutateAsync(next.filter((m) => m !== seed[0]));
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      /* toast handled in hook */
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Assistant"
        title="AI Assistant"
        description="1 credit per reply. Ask about layouts, materials, budgets or briefs."
      />

      <div className="surface-panel flex h-[62vh] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {m.content}
              </p>
            </div>
          ))}
          {ask.isPending && (
            <div className="flex justify-start">
              <p className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Thinking…
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                disabled={ask.isPending || !canAsk}
                onClick={() => send(s)}
              >
                <Sparkles className="size-3.5" /> {s}
              </Button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your design…"
            />
            <Button type="submit" aria-label="Send" disabled={ask.isPending || !canAsk}>
              {ask.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
