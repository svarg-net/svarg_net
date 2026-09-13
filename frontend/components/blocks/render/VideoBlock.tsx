import type { VideoBlockData } from "@/lib/api/blocks";

/** Повторяет detectVideo из редактора */
function detectVideo(url: string): { provider: string; embedUrl: string } {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (yt) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${yt[1]}` };
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { provider: "vimeo", embedUrl: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { provider: "unknown", embedUrl: url };
}

export default function VideoBlock({ data }: { data: VideoBlockData }) {
  const url = data.url || "";
  if (!url) return null;
  const { embedUrl } = detectVideo(url);

  return (
    <figure className="block block-video">
      <div className="block-video-frame">
        <iframe
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={data.caption || "Video"}
        />
      </div>
      {data.caption && <figcaption>{data.caption}</figcaption>}
    </figure>
  );
}
