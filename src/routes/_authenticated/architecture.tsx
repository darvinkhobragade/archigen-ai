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

export const Route = createFileRoute("/_authenticated/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture Generator — ArchiGen AI" },
      {
        name: "description",
        content:
          "Generate exterior architectural concepts from plot size, style, floors and materials.",
      },
      { property: "og:title", content: "Architecture Generator — ArchiGen AI" },
      {
        property: "og:description",
        content: "Turn a building brief into exterior concept renders.",
      },
    ],
  }),
  component: ArchitecturePage,
});

function ArchitecturePage() {
  const [brief, setBrief] = useState("");
  const [buildingType, setBuildingType] = useState("residential");
  const [style, setStyle] = useState("contemporary");
  const [plot, setPlot] = useState("30 x 50 ft");
  const [floors, setFloors] = useState("2");
  const [materials, setMaterials] = useState("Exposed brick, concrete, teak louvres");
  const [greenery, setGreenery] = useState([50]);

  return (
    <>
      <PageHeader
        eyebrow="Generator"
        title="Architecture Generator"
        description="Describe the building. ArchiGen returns exterior concept renders you can save to a project."
      />
      <GeneratorCanvas
        tool="architecture"
        cost={4}
        previewAlt="Generated house exterior concept"
        buildRequest={() =>
          brief.trim().length < 8
            ? "Add a short design brief first (at least a sentence)."
            : {
                prompt: brief.trim(),
                settings: {
                  building_type: buildingType,
                  style,
                  plot_size: plot,
                  floors,
                  materials,
                  greenery: `${greenery[0]}%`,
                },
              }
        }
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="brief">Design brief</Label>
            <PromptEnhancerButton brief={brief} tool="architecture" onEnhanced={setBrief} />
          </div>
          <Textarea
            id="brief"
            rows={4}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Two-storey family home on a 30x50 ft corner plot, exposed brick and concrete, deep balconies…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Building type</Label>
            <Select value={buildingType} onValueChange={setBuildingType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="mixed">Mixed use</SelectItem>
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
                <SelectItem value="contemporary">Contemporary</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="tropical">Tropical modern</SelectItem>
                <SelectItem value="traditional">Traditional Indian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plot">Plot size</Label>
            <Input id="plot" value={plot} onChange={(e) => setPlot(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floors">Floors</Label>
            <Input id="floors" value={floors} onChange={(e) => setFloors(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="materials">Materials</Label>
          <Input id="materials" value={materials} onChange={(e) => setMaterials(e.target.value)} />
        </div>
        <div className="space-y-3">
          <Label>Landscaping / greenery</Label>
          <Slider value={greenery} onValueChange={setGreenery} max={100} step={10} />
        </div>
      </GeneratorCanvas>
    </>
  );
}
