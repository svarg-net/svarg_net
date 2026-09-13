import type {
  Block,
  CalloutBlockData,
  CodeBlockData,
  DividerBlockData,
  GalleryBlockData,
  ImageBlockData,
  ImageTextBlockData,
  QuoteBlockData,
  TextBlockData,
  TableBlockData,
  VideoBlockData,
  TabsBlockData,
  QuizBlockData
} from "@/lib/api/blocks";
import TextBlock from "./render/TextBlock";
import ImageBlock from "./render/ImageBlock";
import ImageTextBlock from "./render/ImageTextBlock";
import CodeBlock from "./render/CodeBlock";
import QuoteBlock from "./render/QuoteBlock";
import CalloutBlock from "./render/CalloutBlock";
import DividerBlock from "./render/DividerBlock";
import GalleryClient from "./GalleryClient";
import TableBlock from "./render/TableBlock";
import VideoBlock from "./render/VideoBlock";
import TabsBlock from "./render/TabsBlock";
import "@/styles/blocks.css";
import QuizBlock from "./render/QuizBlock";
import PollBlock from "./render/PollBlock";

type Props = {
  blocks: Block[];
};

/**
 * Публичный рендерер блоков поста.
 * Server component: контент попадает в HTML для SEO.
 * Интерактив (лайтбокс, копирование) — в клиентских компонентах.
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
      return <GalleryClient data={block.data as GalleryBlockData} />;
    case "quote":
      return <QuoteBlock data={block.data as QuoteBlockData} />;
    case "callout":
      return <CalloutBlock data={block.data as CalloutBlockData} />;
    case "divider":
      return <DividerBlock data={block.data as DividerBlockData} />;
    case "table":
      return <TableBlock data={block.data as TableBlockData} />;
    case "video":
      return <VideoBlock data={block.data as VideoBlockData} />;
    case "tabs":
      return <TabsBlock data={block.data as TabsBlockData} />;
    case "quiz":
      return <QuizBlock data={block.data as QuizBlockData} />;
    case "poll":
      return <PollBlock block={block} />;
    default:
      // Неизвестный тип (волна 3) — молча пропускаем
      return null;
  }
}
