"use client";

import type { VideoBlockData } from "@/lib/api/blocks";

type Props = {
  data: VideoBlockData;
  onChange: (data: Record<string, unknown>) => void;
};

/** Определяет провайдера и embed-URL из ссылки */
export function detectVideo(url: string): {
  provider: string;
  embedUrl: string;
  thumb?: string;
} {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (yt) {
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${yt[1]}`,
      thumb: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`,
    };
  }
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) {
    return {
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`,
    };
  }
  return { provider: "unknown", embedUrl: url };
}

export default function VideoFields({ data, onChange }: Props) {
  const url = data.url || "";
  const info = detectVideo(url);

  return (
    <>
      <div className="block-editor-field">
        <label>Ссылка на видео (YouTube / Vimeo)</label>
        <input
          value={url}
          placeholder="https://www.youtube.com/watch?v=..."
          onChange={(e) => {
            const next = detectVideo(e.target.value);
            onChange({
              ...data,
              url: e.target.value,
              provider: next.provider,
            });
          }}
        />
        <small style={{ color: "#888" }}>
          {url
            ? `Провайдер: ${info.provider}`
            : "Поддерживаются YouTube и Vimeo"}
        </small>
      </div>

      {info.thumb && (
        <div className="block-editor-field">
          <img
            src={info.thumb}
            alt=""
            style={{ maxWidth: "320px", borderRadius: "8px" }}
          />
        </div>
      )}

      <div className="block-editor-field">
        <label>Подпись</label>
        <input
          value={data.caption || ""}
          onChange={(e) => onChange({ ...data, caption: e.target.value })}
        />
      </div>
    </>
  );
}
