import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Loader2,
  Send,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Compass,
  Ruler,
  IndianRupee,
  Palette,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/archigen/generator";
import { toast } from "sonner";
import { useAskAssistant } from "@/hooks/use-generate";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "AI Architectural Assistant — ArchiGen AI" },
      {
        name: "description",
        content:
          "Ask the ArchiGen architectural co-pilot about precision layouts, standard dimensions, Vastu Shastra, material specs, and construction budgets.",
      },
      { property: "og:title", content: "AI Architectural Assistant — ArchiGen AI" },
      {
        property: "og:description",
        content: "A domain-expert design co-pilot for layouts, dimensions, materials, and budgets.",
      },
    ],
  }),
  component: AssistantPage,
});

type Message = { role: "user" | "assistant"; content: string };

const seed: Message[] = [
  {
    role: "assistant",
    content: `### **Welcome to ArchiGen Architectural Assistant**

I am your Senior Architectural Co-Pilot. I can help you with:
*   **Exact Floor Plan Layouts & Dimensions** (Setbacks, room sizing in ft/in, and circulation efficiency).
*   **Vastu Shastra Compliance** (Cardinal orientation for bedrooms, kitchens, entrances & pooja rooms).
*   **Construction & Interior Budgets** (Civil construction rates, modular interior costing in INR).
*   **Ready-to-use 3D Visualizer Prompts** (Optimized for ArchiGen's Floor Plan & 3D Render tools).

Tell me about your plot size, facing direction, budget, or architectural question to begin.`,
  },
];

const SUGGESTION_CATEGORIES = [
  {
    id: "layout",
    label: "Floor Plans",
    icon: Ruler,
    prompts: [
      "Best 3BHK duplex layout for a 30x40 north-facing plot",
      "Vastu floor plan for 30x50 east-facing plot",
      "Compact 2BHK layout for 20x30 south-facing plot",
    ],
  },
  {
    id: "vastu",
    label: "Vastu Guide",
    icon: Compass,
    prompts: [
      "Vastu rules for Master Bedroom, Kitchen & Pooja room",
      "Which quadrant is best for staircase, water tank and main door?",
    ],
  },
  {
    id: "budget",
    label: "Costing (INR)",
    icon: IndianRupee,
    prompts: [
      "Estimated construction cost for 1500 sq ft house in India",
      "Interior budget breakdown for a 3BHK flat under ₹8 lakh",
    ],
  },
  {
    id: "palette",
    label: "Materials & Specs",
    icon: Palette,
    prompts: [
      "Warm Japandi interior palette and material specifications",
      "Standard residential corridor, door and staircase clearances",
    ],
  },
];

/** Formatted architectural message renderer with tables, headings, and copyable prompt boxes */
function FormattedMessage({ content }: { content: string }) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const visualizerPromptMatch = useMemo(() => {
    const m = content.match(
      /(?:ArchiGen\s+(?:Visualizer|Generator)\s+Prompt|Visualizer\s+Prompt)[:\s\n]+["`>]*([^"`\n]+(?:[\n\r]+[^"`\n]+)*?)["`]*(?:\n\n|\n\*|\n---|$)/i,
    );
    return m ? m[1]?.trim() : null;
  }, [content]);

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    toast.success("Visualizer prompt copied to clipboard!");
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const blocks = useMemo(() => {
    const rawLines = content.split("\n");
    const parsed: Array<
      | { type: "table"; headers: string[]; rows: string[][] }
      | { type: "heading"; text: string }
      | { type: "divider" }
      | { type: "list"; items: string[] }
      | { type: "prompt"; text: string }
      | { type: "paragraph"; text: string }
    > = [];

    let currentList: string[] = [];
    let tableBuffer: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        parsed.push({ type: "list", items: [...currentList] });
        currentList = [];
      }
    };

    const flushTable = () => {
      if (tableBuffer.length >= 2) {
        const rows = tableBuffer.map((line) =>
          line
            .split("|")
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1),
        );
        const headers = rows[0] || [];
        const bodyRows = rows.slice(2);
        parsed.push({ type: "table", headers, rows: bodyRows });
      }
      tableBuffer = [];
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i] ?? "";
      const trimmed = line.trim();

      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        flushList();
        tableBuffer.push(trimmed);
        continue;
      } else if (tableBuffer.length > 0) {
        flushTable();
      }

      if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        flushList();
        parsed.push({ type: "divider" });
        continue;
      }

      if (trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
        flushList();
        const headingText = trimmed.replace(/^#{1,3}\s+/, "").replace(/^\*\*|\*\*$/g, "");
        parsed.push({ type: "heading", text: headingText });
        continue;
      }

      if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || /^\d+\.\s+/.test(trimmed)) {
        const itemText = trimmed.replace(/^(\*|-|\d+\.)\s+/, "");
        currentList.push(itemText);
        continue;
      } else if (currentList.length > 0) {
        flushList();
      }

      if (
        trimmed.startsWith("> ") &&
        /modern|residential|duplex|villa|floor plan|layout|architecture|interior/i.test(trimmed)
      ) {
        parsed.push({ type: "prompt", text: trimmed.replace(/^>\s*"?/, "").replace(/"?$/, "") });
        continue;
      }

      if (trimmed) {
        parsed.push({ type: "paragraph", text: trimmed });
      }
    }

    flushList();
    flushTable();

    return parsed;
  }, [content]);

  const renderInline = (str: string) => {
    const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary font-medium"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-secondary-foreground">
      {blocks.map((b, idx) => {
        if (b.type === "heading") {
          return (
            <h4
              key={idx}
              className="mt-3.5 flex items-center gap-2 font-semibold text-foreground tracking-tight text-base border-b border-border/40 pb-1"
            >
              {renderInline(b.text)}
            </h4>
          );
        }
        if (b.type === "divider") {
          return <hr key={idx} className="my-2.5 border-border/50" />;
        }
        if (b.type === "list") {
          return (
            <ul key={idx} className="space-y-1.5 pl-4 list-disc marker:text-primary">
              {b.items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === "table") {
          return (
            <div
              key={idx}
              className="my-3 overflow-x-auto rounded-lg border border-border/60 bg-card/60 shadow-xs"
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/70 text-muted-foreground font-semibold">
                    {b.headers.map((h, hIdx) => (
                      <th key={hIdx} className="px-3 py-2 whitespace-nowrap">
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {b.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={
                        rIdx % 2 === 0 ? "bg-background/40" : "bg-muted/20 hover:bg-muted/40"
                      }
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-foreground/90 leading-normal">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (b.type === "prompt") {
          return (
            <div
              key={idx}
              className="my-3 rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles className="size-3.5" /> ArchiGen Generator Prompt
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs px-2"
                  onClick={() => copyPrompt(b.text)}
                >
                  {copiedPrompt ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copiedPrompt ? "Copied" : "Copy Prompt"}
                </Button>
              </div>
              <p className="font-mono text-xs text-foreground/90 bg-background/80 p-2.5 rounded border border-border/50 select-all leading-relaxed">
                {b.text}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  to="/floor-plan"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  Use in Floor Plan Visualizer <ExternalLink className="size-3" />
                </Link>
                <span className="text-border">•</span>
                <Link
                  to="/architecture"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  Use in 3D Architecture Generator <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
          );
        }
        return (
          <p key={idx} className="leading-relaxed">
            {renderInline(b.text)}
          </p>
        );
      })}

      {visualizerPromptMatch && !blocks.some((b) => b.type === "prompt") && (
        <div className="my-3 rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> ArchiGen Generator Prompt
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs px-2"
              onClick={() => copyPrompt(visualizerPromptMatch)}
            >
              {copiedPrompt ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copiedPrompt ? "Copied" : "Copy Prompt"}
            </Button>
          </div>
          <p className="font-mono text-xs text-foreground/90 bg-background/80 p-2.5 rounded border border-border/50 select-all">
            {visualizerPromptMatch}
          </p>
        </div>
      )}
    </div>
  );
}

function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(seed);
  const [input, setInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("layout");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ask = useAskAssistant();
  const { data: creditProfile } = useProfile();
  const canAsk = (creditProfile?.credits ?? 0) >= 1;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ask.isPending]);

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

  const copyFullMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Message copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages(seed);
    toast.info("Conversation reset");
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <PageHeader
          eyebrow="Architectural Co-Pilot"
          title="AI Assistant"
          description="High-precision design advice for layouts, dimensions, Vastu Shastra, material specs, and construction budgets."
        />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
            1 credit / reply
          </Badge>
          {messages.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      <div className="surface-panel flex h-[68vh] flex-col rounded-xl border border-border/70 overflow-hidden shadow-sm">
        {/* Messages container */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`relative group max-w-[92%] sm:max-w-[85%] rounded-2xl p-4.5 sm:p-5 shadow-xs ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-xs"
                    : "bg-secondary text-secondary-foreground rounded-tl-xs border border-border/40"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="flex items-center justify-between gap-3 border-b border-border/30 pb-2 mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="size-3.5" /> ArchiGen Architect
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyFullMessage(m.content, i)}
                      title="Copy full response"
                    >
                      {copiedIndex === i ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                )}

                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                    {m.content}
                  </p>
                ) : (
                  <FormattedMessage content={m.content} />
                )}
              </div>
            </div>
          ))}

          {ask.isPending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-3 rounded-2xl bg-secondary border border-border/40 px-4 py-3 text-sm text-muted-foreground shadow-xs">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Architect is formulating precise layout & dimensions…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input & Prompt suggestions bar */}
        <div className="border-t border-border bg-card/40 p-4 backdrop-blur-xs">
          {/* Categorized quick questions */}
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {SUGGESTION_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="size-3" /> {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              {SUGGESTION_CATEGORIES.find((c) => c.id === selectedCategory)?.prompts.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  disabled={ask.isPending || !canAsk}
                  onClick={() => send(s)}
                  className="text-xs h-7.5 px-3 bg-background/60 hover:bg-secondary border-border/60 hover:border-primary/40 transition-colors"
                >
                  <Sparkles className="size-3 text-primary mr-1" /> {s}
                </Button>
              ))}
            </div>
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
              placeholder="Ask about plot dimensions (e.g. 30x40 north), Vastu zoning, construction costs, materials…"
              className="bg-background/80 text-sm focus-visible:ring-primary/40"
              disabled={ask.isPending}
            />
            <Button
              type="submit"
              aria-label="Send"
              disabled={ask.isPending || !canAsk || !input.trim()}
              className="px-4"
            >
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

