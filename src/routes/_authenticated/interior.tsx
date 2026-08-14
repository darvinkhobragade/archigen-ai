import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GeneratorCanvas, PageHeader, PromptEnhancerButton } from "@/components/archigen/generator";

export const Route = createFileRoute("/_authenticated/interior")({
  head: () => ({
    meta: [
      { title: "Interior Designer — ArchiGen AI" },
      {
        name: "description",
        content: "Furnish room concepts by style, palette, lighting and budget with AI.",
      },
      { property: "og:title", content: "Interior Designer — ArchiGen AI" },
      {
        property: "og:description",
        content: "AI interior concepts tuned to your style and budget.",
      },
    ],
  }),
  component: InteriorPage,
});

const roomLabels: Record<string, string> = {
  living: "living room",
  bedroom: "bedroom",
  kitchen: "kitchen",
  office: "home office",
  bath: "bathroom",
};

function InteriorPage() {
  const [room, setRoom] = useState("living");
  const [style, setStyle] = useState("warm-minimal");
  const [palette, setPalette] = useState("Oak, linen, travertine");
  const [lighting, setLighting] = useState("evening");
  const [notes, setNotes] = useState("");
  const [budget, setBudget] = useState([40]);

  return (
    <>
      <PageHeader
        eyebrow="Generator"
        title="Interior Designer"
        description="Furnish a room concept by style, palette, lighting and budget."
      />
      <GeneratorCanvas
        tool="interior"
        cost={3}
        previewAlt="Generated interior concept"
        buildRequest={() => ({
          prompt: `A ${style.replace("-", " ")} ${roomLabels[room] ?? room}. ${notes.trim()}`,
          settings: {
            room_type: room,
            style,
            palette,
            lighting,
            budget_level: `${budget[0]}/100`,
          },
        })}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Room type</Label>
            <Select value={room} onValueChange={setRoom}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="living">Living room</SelectItem>
                <SelectItem value="bedroom">Bedroom</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="office">Home office</SelectItem>
                <SelectItem value="bath">Bathroom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warm-minimal">Warm minimal</SelectItem>
                <SelectItem value="scandi">Scandinavian</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="luxury">Modern luxury</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="palette">Palette</Label>
            <Input id="palette" value={palette} onChange={(e) => setPalette(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Lighting</Label>
            <Select value={lighting} onValueChange={setLighting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daylight">Daylight</SelectItem>
                <SelectItem value="evening">Warm evening</SelectItem>
                <SelectItem value="dramatic">Dramatic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="notes">Extra requirements & Decor</Label>
            <PromptEnhancerButton
              brief={notes || `${style} ${roomLabels[room] ?? room}`}
              tool="interior"
              onEnhanced={setNotes}
            />
          </div>
          <Textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Plush sofa, minimalist wall clock on feature wall, coffee table, indoor plants…"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "Modern Wall Clock",
              "Plush Sofa & Cushions",
              "Coffee Table & Rug",
              "Potted Indoor Plants",
              "Framed Wall Art",
              "Pendant Floor Lamp",
            ].map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-secondary-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                onClick={() => {
                  if (!notes.includes(item)) {
                    setNotes((prev) => (prev ? `${prev}, ${item}` : item));
                  }
                }}
              >
                + {item}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Label>Budget level</Label>
          <Slider value={budget} onValueChange={setBudget} max={100} step={10} />
        </div>
      </GeneratorCanvas>
    </>
  );
}
