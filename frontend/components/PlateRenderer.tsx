"use client";

import { useMemo } from "react";
import {
  BaseBlockquotePlugin,
  BaseBoldPlugin,
  BaseCodePlugin,
  BaseH1Plugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseItalicPlugin,
  BaseStrikethroughPlugin,
  BaseUnderlinePlugin,
} from "@platejs/basic-nodes";
import { ListPlugin } from "@platejs/list/react";
import { LinkPlugin } from "@platejs/link/react";
import { CodeBlockPlugin } from "@platejs/code-block/react";
import {
  Plate,
  PlateContent,
  usePlateEditor,
} from "@platejs/core/react";
import type { PlateValue } from "@/lib/plate-types";

type PlateRendererProps = {
  content: PlateValue;
};

export default function PlateRenderer({ content }: PlateRendererProps) {
  const plugins = useMemo(
    () => [
      BaseBoldPlugin,
      BaseItalicPlugin,
      BaseUnderlinePlugin,
      BaseStrikethroughPlugin,
      BaseCodePlugin,
      BaseH1Plugin,
      BaseH2Plugin,
      BaseH3Plugin,
      BaseBlockquotePlugin,
      ListPlugin,
      LinkPlugin,
      CodeBlockPlugin,
    ],
    []
  );

  const editor = usePlateEditor({
    plugins,
    value: content || [],
  });

  return (
    <Plate editor={editor} readOnly>
      <PlateContent
        style={{
          outline: "none",
        }}
        className="md-preview"
      />
    </Plate>
  );
}