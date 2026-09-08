import type {
  Block,
  TextBlockData,
  ImageBlockData,
  ImageTextBlockData,
  CodeBlockData,
  GalleryBlockData,
  QuoteBlockData,
  CalloutBlockData,
  DividerBlockData,
} from "@/lib/api/blocks";
import { resolveImageSrc } from "@/lib/api/blocks";
import PlateRenderer from "@/components/PlateRenderer";
import CopyButton from "@/components/blocks/CopyButton";
import "@/styles/blocks.css";

type Props = {
  blocks: Block[];
};

/**
 * Публичный рендерер блоков поста.
 * Server component: контент попадает в HTML для SEO.
 * Интерактив (копирование кода) вынесен в client-компоненты.
 */
export default function BlockRenderer({ blocks }: Props) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="post-blocks">
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "text":
      return <TextBlock data={block.data as TextBlockData} />;
    case "image":
      return <ImageBlock data={block.data as ImageBlockData} />;
    case "image-text":
      return <ImageTextBlock data={block.data as ImageTextBlockData} />;
    case "code":
      return <CodeBlock data={block.data as CodeBlockData} />;
    case "gallery":
      return <GalleryBlock data={block.data as GalleryBlockData} />;
    case "quote":
      return <QuoteBlock data={block.data as QuoteBlockData} />;
    case "callout":
      return <CalloutBlock data={block.data as CalloutBlockData} />;
    case "divider":
      return <DividerBlock data={block.data as DividerBlockData} />;
    default:
      // Неизвестный тип (например из волны 2) — молча пропускаем
      return null;
  }
}

// ===== text =====
function TextBlock({ data }: { data: TextBlockData }) {
  if (!data.content_json || data.content_json.length === 0) return null;
  return (
    <div className="block block-text">
      <PlateRenderer content={data.content_json} />
    </div>
  );
}

// ===== image =====
function ImageBlock({ data }: { data: ImageBlockData }) {
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

// ===== image-text =====
function ImageTextBlock({ data }: { data: ImageTextBlockData }) {
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

// ===== code =====
function CodeBlock({ data }: { data: CodeBlockData }) {
  const code = data.code || "";
  return (
    <div className="block block-code">
      <div className="block-code-header">
        <span className="block-code-lang">
          {data.filename || data.language || "code"}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="block-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ===== gallery =====
function GalleryBlock({ data }: { data: GalleryBlockData }) {
  const items = data.items || [];
  if (items.length === 0) return null;
  const layout = data.layout || "grid";

  return (
    <div className={`block block-gallery block-gallery--${layout}`}>
      {items.map((item, i) => {
        const src = resolveImageSrc(item);
        if (!src) return null;
        return (
          <figure key={i} className="block-gallery-item">
            <img src={src} alt={item.caption || ""} loading="lazy" />
            {item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}

// ===== quote =====
function QuoteBlock({ data }: { data: QuoteBlockData }) {
  if (!data.text) return null;
  return (
    <blockquote className="block block-quote">
      <p>{data.text}</p>
      {(data.author || data.source) && (
        <cite>
          {data.author}
          {data.author && data.source ? " · " : ""}
          {data.source}
        </cite>
      )}
    </blockquote>
  );
}

// ===== callout =====
function CalloutBlock({ data }: { data: CalloutBlockData }) {
  const type = data.type || "info";
  const icons: Record<string, string> = {
    info: "ℹ️",
    warning: "⚠️",
    error: "⛔",
    success: "✅",
  };
  return (
    <div className={`block block-callout block-callout--${type}`}>
      <div className="block-callout-head">
        <span className="block-callout-icon">{icons[type] || "ℹ️"}</span>
        {data.title && <strong>{data.title}</strong>}
      </div>
      {data.text && <div className="block-callout-text">{data.text}</div>}
    </div>
  );
}

// ===== divider =====
function DividerBlock({ data }: { data: DividerBlockData }) {
  const style = data.style || "line";
  if (style === "space") {
    return <div className="block block-divider block-divider--space" />;
  }
  if (style === "dots") {
    return <div className="block block-divider block-divider--dots">• • •</div>;
  }
  return <hr className="block block-divider block-divider--line" />;
}
