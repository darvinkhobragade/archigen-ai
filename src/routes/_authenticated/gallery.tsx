import { createFileRoute } from "@tanstack/react-router";
import { Heart, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/archigen/generator";
import { images } from "@/lib/archigen-data";

export const Route = createFileRoute("/_authenticated/gallery")({
  head: () => ({
    meta: [
      { title: "Community Gallery — ArchiGen AI" },
      {
        name: "description",
        content: "Explore shared AI-generated architecture, interiors and conceptual floor plans.",
      },
      { property: "og:title", content: "Community Gallery — ArchiGen AI" },
      {
        property: "og:description",
        content: "Public AI design concepts shared by the ArchiGen community.",
      },
    ],
  }),
  component: GalleryPage,
});

const items = [
  { src: images.heroVilla, alt: "Concrete villa at dusk", author: "Meera S.", likes: 214 },
  { src: images.sampleInterior, alt: "Warm minimal living room", author: "Rahul K.", likes: 188 },
  { src: images.samplePlan, alt: "Conceptual floor plan", author: "Ananya P.", likes: 141 },
  { src: images.sampleExterior, alt: "Brick urban house facade", author: "Vikram T.", likes: 132 },
  { src: images.sampleInterior, alt: "Daylit living space", author: "Nisha R.", likes: 97 },
  { src: images.heroVilla, alt: "Poolside villa concept", author: "Dev A.", likes: 86 },
];

function GalleryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Gallery"
        description="Concepts shared publicly by ArchiGen AI users."
      />
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {items.map((item, i) => (
          <figure key={i} className="surface-panel break-inside-avoid overflow-hidden">
            <img src={item.src} alt={item.alt} loading="lazy" className="w-full object-cover" />
            <figcaption className="flex items-center justify-between gap-2 p-3 text-sm">
              <span className="text-muted-foreground">{item.author}</span>
              <span className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => toast("Liked")}>
                  <Heart className="size-4" /> {item.likes}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Share"
                  onClick={() => toast.success("Link copied")}
                >
                  <Share2 className="size-4" />
                </Button>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
