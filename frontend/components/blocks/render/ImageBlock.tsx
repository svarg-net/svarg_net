import type { ImageBlockData } from "@/lib/api/blocks";
import { resolveImageSrc } from "@/lib/api/blocks";

export default function ImageBlock({ data }: { data: ImageBlockData }) {
  const src = resolveImageSrc(data);
  if (!src) return null;
  const align = data.align || "center";
  return (
    <figure className={`block block-image block-image--${align}`}>
      <img src={src} alt={data.caption || ""} loading="lazy" />
      {data.caption && <figcaption>{data.caption}</figcaption>}
    </figure>
  );
}
