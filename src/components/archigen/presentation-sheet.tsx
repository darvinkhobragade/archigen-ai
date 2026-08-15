import { useRef } from "react";
import { Printer, Download, X, Ruler, Sparkles, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PresentationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title?: string | undefined;
  prompt?: string | undefined;
  tool?: string | undefined;
  stylePreset?: string | undefined;
  lightingMood?: string | undefined;
  aspectRatio?: string | undefined;
  seed?: number | undefined;
  authorName?: string | undefined;
}

export function PresentationSheet({
  open,
  onOpenChange,
  imageUrl,
  title = "Architectural Concept Design",
  prompt,
  tool = "Architecture",
  stylePreset = "Photorealistic",
  lightingMood = "Natural Daylight",
  aspectRatio = "16:9",
  seed,
  authorName = "ArchiGen Studio",
}: PresentationSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-background">
        <DialogTitle className="sr-only">Architectural Presentation Sheet</DialogTitle>
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded bg-primary text-primary-foreground">
              <Ruler className="size-3.5" />
            </span>
            <span className="font-display text-sm font-semibold">Client Presentation Sheet</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="size-3.5 mr-1.5" /> Print / Save PDF
            </Button>
            <Button size="sm" asChild>
              <a href={imageUrl} download="archigen-presentation-sheet.jpg" target="_blank" rel="noreferrer">
                <Download className="size-3.5 mr-1.5" /> Download Render
              </a>
            </Button>
          </div>
        </div>

        {/* Printable Architectural Presentation Sheet */}
        <div
          ref={sheetRef}
          className="print-sheet mt-4 rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6"
        >
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/80 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary font-semibold">
                <Building2 className="size-3.5" />
                <span>ArchiGen AI Design Document</span>
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Document generated on {formattedDate} · Project Specifier: {authorName}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="font-mono text-xs uppercase px-2.5 py-1">
                {tool} Visualisation
              </Badge>
            </div>
          </div>

          {/* Hero Concept Image */}
          <div className="overflow-hidden rounded-lg border border-border/70 bg-black/5 shadow-inner">
            <img
              src={imageUrl}
              alt={title}
              className="w-full max-h-[500px] object-contain mx-auto rounded"
            />
          </div>

          {/* Specs & Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg bg-secondary/30 p-4 border border-border/60 text-xs">
            <div>
              <span className="text-muted-foreground uppercase font-mono text-[10px] tracking-wider block">
                Design Aesthetic
              </span>
              <span className="font-medium text-foreground mt-0.5 block capitalize">
                {stylePreset.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground uppercase font-mono text-[10px] tracking-wider block">
                Lighting & Mood
              </span>
              <span className="font-medium text-foreground mt-0.5 block capitalize">
                {lightingMood.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground uppercase font-mono text-[10px] tracking-wider block">
                Aspect Ratio
              </span>
              <span className="font-medium text-foreground mt-0.5 block">{aspectRatio}</span>
            </div>
            <div>
              <span className="text-muted-foreground uppercase font-mono text-[10px] tracking-wider block">
                Generation Seed
              </span>
              <span className="font-mono font-medium text-foreground mt-0.5 block">
                {seed ? `#${seed}` : "Dynamic"}
              </span>
            </div>
          </div>

          {/* Prompt Brief */}
          {prompt && (
            <div className="space-y-1.5 rounded-lg border border-border/60 p-4 bg-background">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3 text-primary" /> Architectural Design Brief
              </span>
              <p className="text-xs text-foreground/90 leading-relaxed italic">"{prompt}"</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
            <span>ArchiGen AI Studio · Autonomous Architectural Generation</span>
            <span>Confidential & Proprietary · Conceptual Concept Only</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
