import type { ImageTextBlockData } from "@/lib/api/blocks";
import { resolveImageSrc } from "@/lib/api/blocks";
import PlateRenderer from "@/components/PlateRenderer";

export default function ImageTextBlock({
  data,
}: {
  data: ImageTextBlockData;
}) {
  const src = resolveImageSrc(data);
  const layout = data.layout || "left";
  return (
    <div className={`block block-image-text block-image-text--${layout}`}>
      {src && (
        <div className="block-image-text-media">
          <img src={src} alt={data.caption || ""} loading="lazy" />
          {data.caption && <figcaption>{data.caption}</figcaption>}
        </div>
      )}
      <div className="block-image-text-content">
        {data.content_json && <PlateRenderer content={data.content_json} />}
      </div>
    </div>
  );
}
