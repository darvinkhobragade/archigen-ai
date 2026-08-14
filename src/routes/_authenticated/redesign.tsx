import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GeneratorCanvas, PageHeader, PromptEnhancerButton } from "@/components/archigen/generator";
import { fileToDataUrl } from "@/hooks/use-generate";

export const Route = createFileRoute("/_authenticated/redesign")({
  head: () => ({
    meta: [
      { title: "Room Redesign — ArchiGen AI" },
      {
        name: "description",
        content: "Upload a photo of a real room and restyle it with AI while keeping the layout.",
      },
      { property: "og:title", content: "Room Redesign — ArchiGen AI" },
      { property: "og:description", content: "Restyle a real room from a single photo." },
    ],
  }),
  component: RedesignPage,
});

function RedesignPage() {
  const [photo, setPhoto] = useState<{ name: string; dataUrl: string } | null>(null);
  const [roomType, setRoomType] = useState("living");
  const [style, setStyle] = useState("scandi");
  const [strength, setStrength] = useState([55]);
  const [keep, setKeep] = useState("");

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setPhoto({ name: file.name, dataUrl });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Generator"
        title="Room Redesign"
        description="Upload a room photo, choose a target style, and keep the existing layout intact."
      />
      <GeneratorCanvas
        tool="redesign"
        cost={3}
        previewAlt="Redesigned room concept"
        sourceImage={photo ? photo.dataUrl : null}
        buildRequest={() =>
          !photo
            ? "Upload a room photo first."
            : {
                prompt: `Restyle this ${roomType} in a ${style} style at ${strength[0]}% transformation strength.${
                  keep.trim() ? ` Keep unchanged: ${keep.trim()}.` : ""
                }`,
                settings: {
                  room_type: roomType,
                  target_style: style,
                  strength: `${strength[0]}%`,
                  keep_unchanged: keep,
                },
                sourceImage: photo.dataUrl,
              }
        }
      >
        <div className="space-y-2">
          <Label htmlFor="photo">Room photo</Label>
          <label
            htmlFor="photo"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-8 text-center transition-colors hover:border-primary/50"
          >
            {photo ? (
              <img
                src={photo.dataUrl}
                alt="Uploaded room"
                className="max-h-40 rounded-md object-cover"
              />
            ) : (
              <Upload className="size-5 text-primary" />
            )}
            <span className="text-sm text-muted-foreground">
              {photo ? photo.name : "JPG or PNG, up to 10 MB"}
            </span>
            <input
              id="photo"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Room type</Label>
            <Select value={roomType} onValueChange={setRoomType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="living">Living room</SelectItem>
                <SelectItem value="bedroom">Bedroom</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scandi">Scandinavian</SelectItem>
                <SelectItem value="japandi">Japandi</SelectItem>
                <SelectItem value="boho">Bohemian</SelectItem>
                <SelectItem value="luxury">Modern luxury</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-3">
          <Label>Transformation strength</Label>
          <Slider value={strength} onValueChange={setStrength} max={100} step={5} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="keep">Keep unchanged</Label>
            <PromptEnhancerButton
              brief={keep || `Restyle ${roomType} to ${style}`}
              tool="redesign"
              onEnhanced={setKeep}
            />
          </div>
          <Textarea
            id="keep"
            rows={2}
            value={keep}
            onChange={(e) => setKeep(e.target.value)}
            placeholder="Window position, flooring, ceiling height…"
          />
        </div>
      </GeneratorCanvas>
    </>
  );
}
