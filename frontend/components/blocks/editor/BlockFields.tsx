"use client";

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
} from "@/lib/api/blocks";
import TextFields from "./fields/TextFields";
import {
  CalloutFields,
  CodeFields,
  DividerFields,
  QuoteFields,
} from "./fields/SimpleFields";
import {
  GalleryFields,
  ImageFields,
  ImageTextFields,
} from "./fields/MediaFields";

type Props = {
  block: Block;
  onChange: (data: Record<string, unknown>) => void;
};

/** Switch по типу блока → нужная форма полей */
export default function BlockFields({ block, onChange }: Props) {
  switch (block.type) {
    case "text":
      return (
        <TextFields
          data={block.data as TextBlockData}
          onChange={onChange}
        />
      );
    case "code":
      return (
        <CodeFields
          data={block.data as CodeBlockData}
          onChange={onChange}
        />
      );
    case "callout":
      return (
        <CalloutFields
          data={block.data as CalloutBlockData}
          onChange={onChange}
        />
      );
    case "quote":
      return (
        <QuoteFields
          data={block.data as QuoteBlockData}
          onChange={onChange}
        />
      );
    case "divider":
      return (
        <DividerFields
          data={block.data as DividerBlockData}
          onChange={onChange}
        />
      );
    case "image":
      return (
        <ImageFields
          data={block.data as ImageBlockData}
          onChange={onChange}
        />
      );
    case "image-text":
      return (
        <ImageTextFields
          data={block.data as ImageTextBlockData}
          onChange={onChange}
        />
      );
    case "gallery":
      return (
        <GalleryFields
          data={block.data as GalleryBlockData}
          onChange={onChange}
        />
      );
    default:
      return (
        <div style={{ color: "#888" }}>
          Редактор для блока <code>{block.type}</code> ещё не реализован.
        </div>
      );
  }
}
